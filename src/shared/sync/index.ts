/**
 * Módulo de sincronização
 * Exporta tipos, adaptadores e gerenciador
 */

export * from './types';
export { BaseSyncAdapter } from './sync-adapter';
export { SyncManager } from './sync-manager';
export { LocalP2PSyncAdapter } from './adapters/local-p2p';
export { DeviceDiscoveryService } from './device-discovery';

// Placeholder para futuros adaptadores
// export { BackendSyncAdapter } from './adapters/backend';
// export { HybridSyncAdapter } from './adapters/hybrid';
// export { QRCodeSyncAdapter } from './adapters/qr-code';
