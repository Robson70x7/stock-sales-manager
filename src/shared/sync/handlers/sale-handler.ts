import { DesktopSyncMessage } from '../types';
import { LocalP2PSyncAdapter } from '../adapters/local-p2p';
import { updateSaleSyncStatus } from '@infra/database/db';

export async function sendSale(
  adapter: LocalP2PSyncAdapter,
  sale: any,
): Promise<void> {
  const message: DesktopSyncMessage = {
    type: 'sale',
    data: sale,
  };
  const result = await adapter.sync(message);
  const resultStatus = await processAck(result, sale.id);
  await updateSaleSyncStatus(
    sale.id,
    resultStatus.syncStatus,
    resultStatus.syncError,
    resultStatus.syncWarnings ? JSON.stringify(resultStatus.syncWarnings) : undefined,
  );
  if (resultStatus.syncStatus === 'failed') {
    throw new Error(resultStatus.syncError || 'Falha ao sincronizar venda');
  }
}

export async function processAck(
  message: DesktopSyncMessage,
  saleId: string,
): Promise<{ syncStatus: string; syncError?: string; syncWarnings?: any[] }> {
  if (message.type !== 'ack' || message.saleId !== saleId) {
    throw new Error(`Ack inválido para venda ${saleId}`);
  }

  if (message.status === 'ok') {
    const result: any = { syncStatus: 'synced' };
    if (message.warnings && message.warnings.length > 0) {
      result.syncWarnings = message.warnings;
    }
    return result;
  }

  if (message.status === 'error') {
    return {
      syncStatus: 'failed',
      syncError: message.message || 'Erro desconhecido',
    };
  }

  throw new Error(`Status de ack desconhecido: ${message.status}`);
}
