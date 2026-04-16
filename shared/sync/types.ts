/**
 * Tipos para sistema de sincronização extensível
 * Suporta múltiplas estratégias: P2P Local, Backend, Híbrida, etc.
 */

export type SyncStrategy = 'local-p2p' | 'backend' | 'hybrid' | 'qr-code';

export interface SyncDevice {
  id: string;
  name: string;
  type: 'mobile' | 'desktop';
  ip?: string;
  port?: number;
  lastSeen: number;
}

export interface SyncConflict {
  id: string;
  type: 'product' | 'sale' | 'client';
  localVersion: any;
  remoteVersion: any;
  timestamp: number;
  resolution?: 'local' | 'remote' | 'merge';
}

export interface SyncState {
  status: 'idle' | 'syncing' | 'connected' | 'error';
  strategy: SyncStrategy;
  lastSync: number;
  conflicts: SyncConflict[];
  devices: SyncDevice[];
  error?: string;
}

export interface SyncMessage {
  type: 'sync-request' | 'sync-response' | 'sync-update' | 'conflict' | 'heartbeat';
  deviceId: string;
  timestamp: number;
  data?: any;
  conflictId?: string;
}

export interface SyncAdapter {
  name: SyncStrategy;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sync(data: any): Promise<any>;
  onMessage(callback: (message: SyncMessage) => void): void;
  getDevices(): Promise<SyncDevice[]>;
}

export interface SyncConflictResolver {
  resolve(conflict: SyncConflict): 'local' | 'remote' | 'merge';
  merge(local: any, remote: any): any;
}
