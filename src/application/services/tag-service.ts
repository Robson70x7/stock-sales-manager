import type { ITagRepository } from '@application/ports/i-tag-repository';
import { Tag } from '@domain/entities/tag';

export class TagService {
  constructor(private tagRepo: ITagRepository) {}

  async list(): Promise<Tag[]> {
    return this.tagRepo.findAll();
  }

  async get(id: string): Promise<Tag | null> {
    return this.tagRepo.findById(id);
  }
}
