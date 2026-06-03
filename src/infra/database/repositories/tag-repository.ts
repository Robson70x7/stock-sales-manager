import * as db from '@infra/database/db';
import { Tag } from '@domain/entities/tag';
import type { ITagRepository } from '@application/ports/i-tag-repository';

export class TagRepository implements ITagRepository {
  async findById(id: string): Promise<Tag | null> {
    const row = await db.getTagById(id);
    if (!row) return null;
    return Tag.fromDb(row);
  }

  async findAll(): Promise<Tag[]> {
    const rows = await db.getTags();
    return rows.map(Tag.fromDb);
  }

  async save(tag: Tag): Promise<void> {
    await db.saveTag(tag.toDb());
  }

  async delete(id: string): Promise<void> {
    await db.deleteTag(id);
  }
}
