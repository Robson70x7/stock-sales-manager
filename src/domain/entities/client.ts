export interface ClientProps {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  tagIds?: string[];
}

export class Client {
  readonly id: string;
  readonly name: string;
  readonly document: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly address: string | null;
  readonly notes: string | null;
  readonly tagIds: string[];
  readonly createdAt: string;
  readonly updatedAt: string;

  private constructor(props: ClientProps) {
    this.id = props.id;
    this.name = props.name;
    this.document = props.document;
    this.phone = props.phone;
    this.email = props.email;
    this.address = props.address;
    this.notes = props.notes;
    this.tagIds = props.tagIds;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static fromDb(
    row: {
      id: string; name: string; document: string | null; phone: string | null;
      email: string | null; address: string | null; notes: string | null;
      createdAt: string; updatedAt: string;
    },
    tagIds: string[],
  ): Client {
    return new Client({
      id: row.id,
      name: row.name,
      document: row.document,
      phone: row.phone,
      email: row.email,
      address: row.address,
      notes: row.notes,
      tagIds,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static create(input: CreateClientInput): Client {
    const now = new Date().toISOString();
    return new Client({
      id: crypto.randomUUID?.() ?? generateFallbackId(),
      name: input.name,
      document: input.document ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
      tagIds: input.tagIds ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  toDb(): {
    id: string; name: string; document: string | null; phone: string | null;
    email: string | null; address: string | null; notes: string | null;
    createdAt: string; updatedAt: string;
  } {
    return {
      id: this.id,
      name: this.name,
      document: this.document,
      phone: this.phone,
      email: this.email,
      address: this.address,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

function generateFallbackId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
