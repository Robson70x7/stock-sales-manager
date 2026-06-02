import { DesktopSyncMessage } from '../types';
import { LocalP2PSyncAdapter } from '../adapters/local-p2p';
import { mergeProducts, mergeClients, mergeTags, mergeSuppliers, saveSetting } from '@/lib/database/db';

export async function pullCatalog(
  adapter: LocalP2PSyncAdapter,
  entity: 'products' | 'clients' | 'tags' | 'suppliers',
  since?: string,
): Promise<void> {
  const message: DesktopSyncMessage = {
    type: 'pull',
    entity,
    ...(since ? { since } : {}),
  };
  const result = await adapter.sync(message);
  if (!result.success) {
    throw new Error(`Falha ao enviar pull para ${entity}`);
  }
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
    default:
      throw new Error(`Entidade desconhecida: ${entity}`);
  }

  await saveSetting(`last_sync_timestamp_${entity}`, timestamp);
}
