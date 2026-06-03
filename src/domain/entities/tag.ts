export interface TagProps {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export class Tag {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly createdAt: string;

  private constructor(props: TagProps) {
    this.id = props.id;
    this.name = props.name;
    this.color = props.color;
    this.createdAt = props.createdAt;
  }

  static fromDb(row: {
    id: string; name: string; color: string; createdAt: string;
  }): Tag {
    return new Tag({
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: row.createdAt,
    });
  }

  static create(input: { name: string; color: string }): Tag {
    return new Tag({
      id: crypto.randomUUID?.() ?? generateFallbackId(),
      name: input.name,
      color: input.color,
      createdAt: new Date().toISOString(),
    });
  }

  toDb(): { id: string; name: string; color: string; createdAt: string } {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      createdAt: this.createdAt,
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
