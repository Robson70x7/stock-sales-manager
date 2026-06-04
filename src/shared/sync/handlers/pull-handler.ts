import { DesktopSyncMessage } from '../types';
import { LocalP2PSyncAdapter } from '../adapters/local-p2p';
import {
  mergeProducts, mergeClients, mergeTags, mergeSuppliers,
  mergeUsers, mergeRoles,
  saveSetting,
} from '@infra/database/db';

export type SyncEntity = 'products' | 'clients' | 'tags' | 'suppliers' | 'users' | 'roles';

export async function pullCatalog(
  adapter: LocalP2PSyncAdapter,
  entity: SyncEntity,
  since?: string,
): Promise<number> {
  const message: DesktopSyncMessage = {
    type: 'pull',
    entity,
    ...(since ? { since } : {}),
  };
  const result = await adapter.sync(message);
  if (result.type !== 'pull_result') {
    throw new Error(`Resposta inesperada para pull de ${entity}: ${result.type}`);
  }
  if (result.data && Array.isArray(result.data)) {
    await applyPullResult(entity, result.data, result.timestamp || new Date().toISOString());
    return result.data.length;
  }
  return 0;
}

export async function applyPullResult(
  entity: string,
  data: any[],
  timestamp: string,
): Promise<void> {
  if (!data || !Array.isArray(data)) {
    throw new Error(`Dados inválidos para ${entity}`);
  }

  switch (entity) {
    case 'products':
      await mergeProducts(data);
      break;
    case 'clients':
      await mergeClients(data);
      break;
    case 'tags':
      await mergeTags(data);
      break;
    case 'suppliers':
      await mergeSuppliers(data);
      break;
    case 'roles':
      await mergeRoles(data);
      break;
    case 'users':
      await mergeUsers(data);
      break;
    default:
      throw new Error(`Entidade desconhecida: ${entity}`);
  }

  await saveSetting(`last_sync_timestamp_${entity}`, timestamp);
}
