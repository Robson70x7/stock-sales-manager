/**
 * Gerenciador de conflitos de sincronização
 * Resolve conflitos entre versões locais e remotas de dados
 */

import { SyncConflict, SyncConflictResolver } from './types';

export class ConflictResolver implements SyncConflictResolver {
  /**
   * Resolver um conflito
   * Estratégia: Última edição vence (timestamp)
   */
  resolve(conflict: SyncConflict): 'local' | 'remote' | 'merge' {
    const localTimestamp = conflict.localVersion?.updatedAt || 0;
    const remoteTimestamp = conflict.remoteVersion?.updatedAt || 0;

    if (remoteTimestamp > localTimestamp) {
      return 'remote';
    } else if (localTimestamp > remoteTimestamp) {
      return 'local';
    } else {
      // Se timestamps são iguais, tentar fazer merge
      return 'merge';
    }
  }

  /**
   * Fazer merge de duas versões
   * Estratégia: Mesclar campos que não conflitam
   */
  merge(local: any, remote: any): any {
    if (!local || !remote) {
      return local || remote;
    }

    const merged = { ...local };

    for (const key in remote) {
      if (key === 'updatedAt' || key === 'id') {
        continue; // Pular campos especiais
      }

      // Se o campo é diferente em ambas as versões
      if (JSON.stringify(local[key]) !== JSON.stringify(remote[key])) {
        // Se é um objeto, tentar fazer merge recursivo
        if (typeof local[key] === 'object' && typeof remote[key] === 'object') {
          merged[key] = this.merge(local[key], remote[key]);
        } else {
          // Caso contrário, usar a versão mais recente
          const localTime = local.updatedAt || 0;
          const remoteTime = remote.updatedAt || 0;
          merged[key] = remoteTime > localTime ? remote[key] : local[key];
        }
      }
    }

    return merged;
  }

  /**
   * Detectar conflitos entre duas versões
   */
  detectConflicts(localData: any[], remoteData: any[]): SyncConflict[] {
    const conflicts: SyncConflict[] = [];
    const localMap = new Map(localData.map(item => [item.id, item]));
    const remoteMap = new Map(remoteData.map(item => [item.id, item]));

    // Verificar itens que existem em ambas as versões
    for (const [id, localItem] of localMap) {
      const remoteItem = remoteMap.get(id);
      if (remoteItem) {
        // Comparar versões
        if (JSON.stringify(localItem) !== JSON.stringify(remoteItem)) {
          conflicts.push({
            id: `conflict-${id}-${Date.now()}`,
            type: localItem.type || 'product',
            localVersion: localItem,
            remoteVersion: remoteItem,
            timestamp: Date.now(),
          });
        }
      }
    }

    return conflicts;
  }
}
