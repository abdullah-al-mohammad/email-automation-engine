import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../../domain/aggregates/tag.aggregate';
import { TagRepository } from '../../domain/repositories/tag.repository';

@Injectable()
export class TypeOrmTagRepository implements TagRepository {
  constructor(
    @InjectRepository(Tag)
    private readonly repository: Repository<Tag>,
  ) {}

  async findById(id: string): Promise<Tag | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAllByTenantId(tenantId: string): Promise<Tag[]> {
    return this.repository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async findByTenantIdAndName(tenantId: string, name: string): Promise<Tag | null> {
    return this.repository.findOne({ where: { tenantId, name } });
  }

  async save(tag: Tag): Promise<Tag> {
    return this.repository.save(tag);
  }
}
