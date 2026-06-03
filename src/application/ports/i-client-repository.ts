import type { Client } from '@domain/entities/client';

export interface IClientRepository {
  findById(id: string): Promise<Client | null>;
  findAll(): Promise<Client[]>;
  save(client: Client): Promise<void>;
  delete(id: string): Promise<void>;
  saveTags(clientId: string, tagIds: string[]): Promise<void>;
}
