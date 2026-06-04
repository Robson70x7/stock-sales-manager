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
  status: 'idle' | 'syncing' | 'connected' | 'error' | 'reconnecting';
  strategy: SyncStrategy;
  lastSync: number;
  conflicts: SyncConflict[];
  devices: SyncDevice[];
  error?: string;
  desktopDeviceId?: string;
  lastSyncTimestamp?: string;
}

// Desktop sync protocol message types
export type DesktopSyncMessageType = 'handshake' | 'handshake_ack' | 'pull' | 'pull_result' | 'sale' | 'ack' | 'error';

export interface DesktopSyncMessage {
  type: DesktopSyncMessageType;
  version?: string;
  deviceId?: string;
  correlationId?: string;
  entity?: 'products' | 'clients' | 'tags' | 'suppliers' | 'users' | 'roles';
  since?: string;
  data?: any;
  timestamp?: string;
  saleId?: string;
  status?: 'ok' | 'error';
  warnings?: Array<{ productId: string; productName: string; available: number; quantity: number }>;
  message?: string;
}

export interface SyncMessage {
  type: 'sync-request' | 'sync-response' | 'sync-update' | 'conflict' | 'heartbeat' | DesktopSyncMessageType;
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
