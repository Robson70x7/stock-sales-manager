import type { Tag } from '@domain/entities/tag';

export interface ITagRepository {
  findById(id: string): Promise<Tag | null>;
  findAll(): Promise<Tag[]>;
  save(tag: Tag): Promise<void>;
  delete(id: string): Promise<void>;
}
