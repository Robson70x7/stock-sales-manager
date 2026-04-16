/**
 * Classe base abstrata para adaptadores de sincronização
 * Todas as estratégias devem estender esta classe
 */

import { SyncAdapter, SyncMessage, SyncDevice, SyncStrategy } from './types';

export abstract class BaseSyncAdapter implements SyncAdapter {
  abstract name: SyncStrategy;
  protected messageCallbacks: ((message: SyncMessage) => void)[] = [];
  protected connected = false;

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sync(data: any): Promise<any>;
  abstract getDevices(): Promise<SyncDevice[]>;

  onMessage(callback: (message: SyncMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  protected emitMessage(message: SyncMessage): void {
    this.messageCallbacks.forEach(cb => cb(message));
  }

  isConnected(): boolean {
    return this.connected;
  }
}
