import { DesktopSyncMessage } from '../types';
import { LocalP2PSyncAdapter } from '../adapters/local-p2p';
import { updateClientSyncStatus } from '@infra/database/db';

export async function sendClient(
  adapter: LocalP2PSyncAdapter,
  client: any,
): Promise<void> {
  const message: DesktopSyncMessage = {
    type: 'client',
    data: client,
  };
  const result = await adapter.sync(message);
  const resultStatus = await processClientAck(result, client.id);
  await updateClientSyncStatus(
    client.id,
    resultStatus.syncStatus,
    resultStatus.syncError,
  );
  if (resultStatus.syncStatus === 'failed') {
    throw new Error(resultStatus.syncError || 'Falha ao sincronizar cliente');
  }
}

export async function processClientAck(
  message: DesktopSyncMessage,
  clientId: string,
): Promise<{ syncStatus: string; syncError?: string }> {
  if (message.type !== 'ack' || (message.clientId !== clientId && message.clientId !== undefined)) {
    if (message.clientId === undefined) {
      return { syncStatus: 'synced' };
    }
    throw new Error(`Ack inválido para cliente ${clientId}`);
  }

  if (message.status === 'ok') {
    return { syncStatus: 'synced' };
  }

  if (message.status === 'error') {
    return {
      syncStatus: 'failed',
      syncError: message.message || 'Erro desconhecido',
    };
  }

  throw new Error(`Status de ack desconhecido: ${message.status}`);
}
