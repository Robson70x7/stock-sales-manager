import type { IClientRepository } from '@application/ports/i-client-repository';
import { Client } from '@domain/entities/client';
import type { CreateClientInput } from '@domain/entities/client';
import { ClientNotFoundError } from './errors';

export class ClientService {
  constructor(private clientRepo: IClientRepository) {}

  async list(): Promise<Client[]> {
    return this.clientRepo.findAll();
  }

  async get(id: string): Promise<Client | null> {
    return this.clientRepo.findById(id);
  }

  async create(input: CreateClientInput): Promise<Client> {
    const client = Client.create(input);
    await this.clientRepo.save(client);
    return client;
  }

  async update(client: Client): Promise<void> {
    const existing = await this.clientRepo.findById(client.id);
    if (!existing) throw new ClientNotFoundError(client.id);
    await this.clientRepo.save(client);
  }

  async delete(id: string): Promise<void> {
    await this.clientRepo.delete(id);
  }
}
