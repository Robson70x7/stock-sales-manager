import { BaseSyncAdapter } from './sync-adapter';
import { SyncState, SyncStrategy, SyncConflict, SyncMessage, DesktopSyncMessage } from './types';
import { getSetting, saveSetting, getSales } from '@infra/database/db';
import { pullCatalog, applyPullResult } from './handlers/pull-handler';
import { sendSale, processAck } from './handlers/sale-handler';
import { LocalP2PSyncAdapter } from './adapters/local-p2p';

export class SyncManager {
  private adapter?: BaseSyncAdapter;
  private state: SyncState = {
    status: 'idle',
    strategy: 'local-p2p',
    lastSync: 0,
    conflicts: [],
    devices: [],
  };
  private stateCallbacks: ((state: SyncState) => void)[] = [];

  async initialize(adapter: BaseSyncAdapter): Promise<void> {
    this.adapter = adapter;
    this.state.strategy = adapter.name;

    try {
      const lastSync = await getSetting('last_sync_timestamp');
      if (lastSync) {
        this.state.lastSync = parseInt(lastSync, 10);
      }
      const desktopDeviceId = await getSetting('desktop_device_id');
      if (desktopDeviceId) {
        this.state.desktopDeviceId = desktopDeviceId;
      }
    } catch {
    }

    adapter.onMessage((message: SyncMessage) => {
      this.handleMessage(message);
    });

    try {
      this.updateState({ status: 'syncing' });
      await adapter.connect();
      this.updateState({ status: 'connected' });
    } catch (error) {
      this.updateState({
        status: 'error',
        error: `Erro ao conectar: ${error}`,
      });
      throw error;
    }
  }

  async syncAll(): Promise<{ products: number; clients: number; tags: number; suppliers: number; sales: number }> {
    if (!this.adapter || !(this.adapter instanceof LocalP2PSyncAdapter)) {
      throw new Error('Adaptador não é LocalP2PSyncAdapter');
    }

    const adapter = this.adapter as LocalP2PSyncAdapter;
    const result = { products: 0, clients: 0, tags: 0, suppliers: 0, sales: 0 };

    try {
      this.updateState({ status: 'syncing' });

      // Pull catalog for each entity
      this.updateState({ status: 'syncing', error: 'Sincronizando produtos...' });
      const productsSince = await getSetting('last_sync_timestamp_products');
      result.products = await pullCatalog(adapter, 'products', productsSince || undefined);

      this.updateState({ status: 'syncing', error: 'Sincronizando clientes...' });
      const clientsSince = await getSetting('last_sync_timestamp_clients');
      result.clients = await pullCatalog(adapter, 'clients', clientsSince || undefined);

      this.updateState({ status: 'syncing', error: 'Sincronizando tags...' });
      const tagsSince = await getSetting('last_sync_timestamp_tags');
      result.tags = await pullCatalog(adapter, 'tags', tagsSince || undefined);

      this.updateState({ status: 'syncing', error: 'Sincronizando fornecedores...' });
      const suppliersSince = await getSetting('last_sync_timestamp_suppliers');
      result.suppliers = await pullCatalog(adapter, 'suppliers', suppliersSince || undefined);

      // Send pending sales
      this.updateState({ status: 'syncing', error: 'Enviando vendas pendentes...' });
      const pendingSales = await this.getPendingSales();
      for (const sale of pendingSales) {
        try {
          await sendSale(adapter, sale);
          result.sales++;
        } catch (err) {
          console.error(`[SyncManager] Erro ao enviar venda ${sale.id}:`, err);
        }
      }

      const now = Date.now();
      this.updateState({
        status: 'connected',
        lastSync: now,
      });
      await saveSetting('last_sync_timestamp', now.toString());
    } catch (error) {
      this.updateState({
        status: 'error',
        error: `Erro ao sincronizar: ${error}`,
      });
      throw error;
    }

    return result;
  }

  async getPendingSales(): Promise<any[]> {
    try {
      const sales = await getSales();
      return sales.filter(s => s.syncStatus !== 'synced');
    } catch {
      return [];
    }
  }

  async sync(data: any): Promise<any> {
    if (!this.adapter) {
      throw new Error('Adaptador não inicializado');
    }

    try {
      this.updateState({ status: 'syncing' });
      const result = await this.adapter.sync(data);
      const now = Date.now();
      this.updateState({
        status: 'connected',
        lastSync: now,
      });
      try {
        await saveSetting('last_sync_timestamp', now.toString());
      } catch {
      }
      return result;
    } catch (error) {
      this.updateState({
        status: 'error',
        error: `Erro ao sincronizar: ${error}`,
      });
      throw error;
    }
  }

  resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merge'): void {
    const conflict = this.state.conflicts.find(c => c.id === conflictId);
    if (conflict) {
      conflict.resolution = resolution;
      this.updateState({
        conflicts: this.state.conflicts.filter(c => c.id !== conflictId),
      });
    }
  }

  getState(): SyncState {
    return { ...this.state };
  }

  onStateChange(callback: (state: SyncState) => void): void {
    this.stateCallbacks.push(callback);
  }

  async disconnect(): Promise<void> {
    if (this.adapter) {
      await this.adapter.disconnect();
      this.updateState({ status: 'idle' });
    }
  }

  private handleMessage(message: SyncMessage): void {
    console.log('[SyncManager] Mensagem recebida:', message);

    const desktopMsg = message.data as DesktopSyncMessage;

    switch (message.type) {
      case 'pull_result':
        if (desktopMsg.entity && desktopMsg.data && desktopMsg.timestamp) {
          applyPullResult(desktopMsg.entity, desktopMsg.data, desktopMsg.timestamp).catch(err => {
            console.error('[SyncManager] Erro ao aplicar pull result:', err);
          });
        }
        break;
      case 'ack':
        if (desktopMsg) {
          const saleId = desktopMsg.saleId || '';
          processAck(desktopMsg, saleId).catch(err => {
            console.error('[SyncManager] Erro ao processar ack:', err);
          });
        }
        break;
      case 'handshake_ack':
        if (desktopMsg?.deviceId) {
          this.state.desktopDeviceId = desktopMsg.deviceId;
          saveSetting('desktop_device_id', desktopMsg.deviceId).catch(() => {});
        }
        break;
      case 'sync-request':
        break;
      case 'conflict':
        this.addConflict(message.data);
        break;
      case 'heartbeat':
        break;
      case 'error':
        console.error('[SyncManager] Erro recebido do desktop:', desktopMsg.message || desktopMsg);
        break;
    }
  }

  private addConflict(conflict: SyncConflict): void {
    this.updateState({
      conflicts: [...this.state.conflicts, conflict],
    });
  }

  private updateState(partial: Partial<SyncState>): void {
    this.state = { ...this.state, ...partial };
    this.stateCallbacks.forEach(cb => cb(this.state));
  }
}
