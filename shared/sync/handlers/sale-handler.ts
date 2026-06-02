import { DesktopSyncMessage } from '../types';
import { LocalP2PSyncAdapter } from '../adapters/local-p2p';
import { saveSale } from '@/lib/database/db';

export function sendSale(
  adapter: LocalP2PSyncAdapter,
  sale: any,
): Promise<void> {
  const message: DesktopSyncMessage = {
    type: 'sale',
    data: sale,
  };
  return adapter.sync(message);
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
