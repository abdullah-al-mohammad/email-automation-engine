import { Injectable, Inject } from '@nestjs/common';
import { TAG_REPOSITORY } from '../../constants/tokens';
import { TagRepository } from '../../domain/repositories/tag.repository';
import { type TagResponse } from '@email-automation-engine/shared';

@Injectable()
export class TagService {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: TagRepository,
  ) {}

  async findAllByTenantId(tenantId: string): Promise<TagResponse[]> {
    const tags = await this.tagRepository.findAllByTenantId(tenantId);
    return tags.map((t) => ({
      id: t.id,
      tenantId: t.tenantId,
      name: t.name,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
  }
}
