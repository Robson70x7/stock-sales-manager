/**
 * Gerenciador central de sincronização
 * Coordena diferentes adaptadores e estratégias de sincronização
 */

import { BaseSyncAdapter } from './sync-adapter';
import { SyncState, SyncStrategy, SyncConflict, SyncMessage } from './types';

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

  /**
   * Inicializar com um adaptador específico
   */
  async initialize(adapter: BaseSyncAdapter): Promise<void> {
    this.adapter = adapter;
    this.state.strategy = adapter.name;

    // Registrar callback de mensagens
    adapter.onMessage((message: SyncMessage) => {
      this.handleMessage(message);
    });

    // Conectar ao adaptador
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

  /**
   * Sincronizar dados
   */
  async sync(data: any): Promise<any> {
    if (!this.adapter) {
      throw new Error('Adaptador não inicializado');
    }

    try {
      this.updateState({ status: 'syncing' });
      const result = await this.adapter.sync(data);
      this.updateState({
        status: 'connected',
        lastSync: Date.now(),
      });
      return result;
    } catch (error) {
      this.updateState({
        status: 'error',
        error: `Erro ao sincronizar: ${error}`,
      });
      throw error;
    }
  }

  /**
   * Resolver conflito de sincronização
   */
  resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merge'): void {
    const conflict = this.state.conflicts.find(c => c.id === conflictId);
    if (conflict) {
      conflict.resolution = resolution;
      this.updateState({
        conflicts: this.state.conflicts.filter(c => c.id !== conflictId),
      });
    }
  }

  /**
   * Obter estado atual
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Registrar callback para mudanças de estado
   */
  onStateChange(callback: (state: SyncState) => void): void {
    this.stateCallbacks.push(callback);
  }

  /**
   * Desconectar
   */
  async disconnect(): Promise<void> {
    if (this.adapter) {
      await this.adapter.disconnect();
      this.updateState({ status: 'idle' });
    }
  }

  private handleMessage(message: SyncMessage): void {
    console.log('[SyncManager] Mensagem recebida:', message);

    switch (message.type) {
      case 'sync-request':
        // Processar solicitação de sincronização
        break;
      case 'conflict':
        // Adicionar conflito à lista
        this.addConflict(message.data);
        break;
      case 'heartbeat':
        // Atualizar dispositivo
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
