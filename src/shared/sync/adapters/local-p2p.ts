import { BaseSyncAdapter } from '../sync-adapter';
import { SyncDevice, SyncMessage, SyncStrategy, DesktopSyncMessage } from '../types';
import { DeviceDiscoveryService } from '../device-discovery';

interface PendingRequest {
  resolve: (data: DesktopSyncMessage) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class LocalP2PSyncAdapter extends BaseSyncAdapter {
  name: SyncStrategy = 'local-p2p';
  private ws: WebSocket | null = null;
  private deviceId: string;
  private port: number = 9999;
  private desktopIp: string | null = null;
  private discovery: DeviceDiscoveryService;
  private handshakeTimeout: ReturnType<typeof setTimeout> | null = null;
  private handshakeResolve: (() => void) | null = null;
  private handshakeReject: ((err: Error) => void) | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private statusCallbacks: ((status: 'connected' | 'disconnected', message?: string) => void)[] = [];

  constructor(deviceId: string, discovery: DeviceDiscoveryService, port?: number) {
    super();
    this.deviceId = deviceId;
    this.discovery = discovery;
    if (port) this.port = port;
  }

  onStatusChange(callback: (status: 'connected' | 'disconnected', message?: string) => void): void {
    this.statusCallbacks.push(callback);
  }

  private emitStatus(status: 'connected' | 'disconnected', message?: string): void {
    for (const cb of this.statusCallbacks) {
      cb(status, message);
    }
  }

  async connect(): Promise<void> {
    if (!this.desktopIp) {
      const devices = this.discovery.getDevices();
      const desktop = devices.find(d => d.type === 'desktop');
      if (!desktop?.ip) {
        throw new Error('Nenhum desktop encontrado na rede');
      }
      this.desktopIp = desktop.ip;
    }
    await this.doConnect();
  }

  connectToIp(ip: string): Promise<void> {
    this.desktopIp = ip;
    return this.doConnect();
  }

  private doConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.desktopIp) {
        reject(new Error('IP do desktop não configurado'));
        return;
      }

      const url = `ws://${this.desktopIp}:${this.port}`;
      console.log(`[P2P] Conectando a ${url}...`);

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[P2P] WebSocket conectado');
        this.connected = true;
        this.emitStatus('connected');
        this.handshakeResolve = resolve;
        this.handshakeReject = reject;
        this.startHandshakeTimeout();
        setTimeout(() => this.performHandshake(), 200);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data) as DesktopSyncMessage;
          this.handleDesktopMessage(message);
        } catch (err) {
          console.error('[P2P] Erro ao processar mensagem:', err);
        }
      };

      this.ws.onerror = () => {
        if (!this.connected) {
          reject(new Error('Falha ao conectar ao desktop'));
        }
      };

      this.ws.onclose = () => {
        console.log('[P2P] WebSocket fechado');
        this.connected = false;
        this.ws = null;
        this.rejectAllPending(new Error('Conexão perdida'));
        this.emitStatus('disconnected', 'Conexão perdida');
      };
    });
  }

  private performHandshake(): void {
    if (!this.ws) return;
    const handshake: DesktopSyncMessage = {
      type: 'handshake',
      version: '1.0',
      deviceId: this.deviceId,
    };
    const payload = JSON.stringify(handshake);
    console.log('[P2P] Enviando handshake:', payload);
    this.ws.send(payload);
  }

  private startHandshakeTimeout(): void {
    this.handshakeTimeout = setTimeout(() => {
      if (this.handshakeReject) {
        this.handshakeReject(new Error('Handshake timeout'));
        this.handshakeResolve = null;
        this.handshakeReject = null;
      }
      this.disconnect();
    }, 5000);
  }

  private handleDesktopMessage(message: DesktopSyncMessage): void {
    if (message.type === 'handshake_ack') {
      if (this.handshakeTimeout) {
        clearTimeout(this.handshakeTimeout);
        this.handshakeTimeout = null;
      }
      if (this.handshakeResolve) {
        this.handshakeResolve();
        this.handshakeResolve = null;
        this.handshakeReject = null;
      }
      return;
    }

    const correlationId = message.correlationId;
    if (correlationId && this.pendingRequests.has(correlationId)) {
      const pending = this.pendingRequests.get(correlationId)!;
      clearTimeout(pending.timer);
      this.pendingRequests.delete(correlationId);
      if (message.type === 'error') {
        pending.reject(new Error(message.message || 'Erro do desktop'));
      } else {
        pending.resolve(message);
      }
      return;
    }

    const syncMessage: SyncMessage = {
      type: message.type as any,
      deviceId: message.deviceId || this.desktopIp || '',
      timestamp: message.timestamp ? new Date(message.timestamp).getTime() : Date.now(),
      data: message,
    };
    this.emitMessage(syncMessage);
  }

  private rejectAllPending(error: Error): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }

  async disconnect(): Promise<void> {
    if (this.handshakeTimeout) {
      clearTimeout(this.handshakeTimeout);
      this.handshakeTimeout = null;
    }
    if (this.handshakeReject) {
      this.handshakeReject(new Error('Desconectado'));
      this.handshakeResolve = null;
      this.handshakeReject = null;
    }

    this.rejectAllPending(new Error('Desconectado'));

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.emitStatus('disconnected');
    console.log('[P2P] Desconectado');
  }

  async sync(data: any): Promise<any> {
    if (!this.connected || !this.ws) {
      throw new Error('Não conectado ao desktop');
    }

    const correlationId = this.generateId();
    const msg = { ...data, correlationId };

    return new Promise<DesktopSyncMessage>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error(`Timeout na requisição ${correlationId} (tipo: ${data.type})`));
      }, 60000);

      this.pendingRequests.set(correlationId, { resolve, reject, timer });

      try {
        const payload = JSON.stringify(msg);
        console.log(`[P2P] Enviando mensagem (${data.type}):`, payload.substring(0, 200));
        this.ws!.send(payload);
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(correlationId);
        reject(new Error(`Erro ao enviar mensagem: ${err}`));
      }
    });
  }

  private generateId(): string {
    const hex = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < 32; i++) {
      id += hex[Math.floor(Math.random() * 16)];
    }
    return id;
  }

  async getDevices(): Promise<SyncDevice[]> {
    return this.discovery.getDevices();
  }

  setDesktopIp(ip: string): void {
    this.desktopIp = ip;
  }
}
