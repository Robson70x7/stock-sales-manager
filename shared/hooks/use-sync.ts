/**
 * Hook de sincronização para React
 * Gerencia o estado e ciclo de vida da sincronização
 */

import { useState, useEffect, useCallback } from 'react';
import { SyncManager } from '../sync/sync-manager';
import { SyncState, SyncDevice } from '../sync/types';

export function useSync(syncManager: SyncManager) {
  const [syncState, setSyncState] = useState<SyncState>(syncManager.getState());
  const [devices, setDevices] = useState<SyncDevice[]>([]);

  useEffect(() => {
    // Registrar listener de mudanças de estado
    syncManager.onStateChange((state) => {
      setSyncState(state);
      setDevices(state.devices);
    });
  }, [syncManager]);

  const startSync = useCallback(async () => {
    try {
      await syncManager.sync({});
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    }
  }, [syncManager]);

  const stopSync = useCallback(async () => {
    await syncManager.disconnect();
  }, [syncManager]);

  const resolveConflict = useCallback(
    (conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
      syncManager.resolveConflict(conflictId, resolution);
    },
    [syncManager]
  );

  return {
    state: syncState,
    devices,
    startSync,
    stopSync,
    resolveConflict,
  };
}
