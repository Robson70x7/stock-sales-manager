import * as db from '@infra/database/db';
import { Client } from '@domain/entities/client';
import type { IClientRepository } from '@application/ports/i-client-repository';

export class ClientRepository implements IClientRepository {
  async findById(id: string): Promise<Client | null> {
    const row = await db.getClientById(id);
    if (!row) return null;
    const tagIds = await db.getClientTags(id);
    return Client.fromDb(row, tagIds);
  }

  async findAll(): Promise<Client[]> {
    const rows = await db.getClients();
    const result: Client[] = [];
    for (const row of rows) {
      const tagIds = await db.getClientTags(row.id);
      result.push(Client.fromDb(row, tagIds));
    }
    return result;
  }

  async save(client: Client): Promise<void> {
    await db.saveClient(client.toDb());
    await db.setClientTags(client.id, client.tagIds);
  }

  async delete(id: string): Promise<void> {
    await db.deleteClient(id);
    await db.deleteClientTags(id);
  }

  async saveTags(clientId: string, tagIds: string[]): Promise<void> {
    await db.setClientTags(clientId, tagIds);
  }
}
