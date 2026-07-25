import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { TAG_REPOSITORY } from '../../constants/tokens';
import { TagRepository } from '../../domain/repositories/tag.repository';
import { Tag } from '../../domain/aggregates/tag.aggregate';
import { type TagResponse, type CreateTagDto } from '@email-automation-engine/shared';

@Injectable()
export class TagService {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: TagRepository,
  ) {}

  async findAllByTenantId(tenantId: string): Promise<TagResponse[]> {
    const tags = await this.tagRepository.findAllByTenantId(tenantId);
    return tags.map((t) => this.toResponse(t));
  }

  async create(tenantId: string, dto: CreateTagDto): Promise<TagResponse> {
    const existing = await this.tagRepository.findByTenantIdAndName(tenantId, dto.name);
    if (existing) {
      throw new ConflictException('A tag with this name already exists');
    }

    const tag = new Tag();
    tag.tenantId = tenantId;
    tag.name = dto.name;

    const saved = await this.tagRepository.save(tag);
    return this.toResponse(saved);
  }

  async delete(tenantId: string, tagId: string): Promise<void> {
    const tag = await this.tagRepository.findById(tagId);
    if (!tag || tag.tenantId !== tenantId) {
      throw new NotFoundException('Tag not found');
    }
    await this.tagRepository.deleteById(tagId);
  }

  private toResponse(tag: Tag): TagResponse {
    return {
      id: tag.id,
      tenantId: tag.tenantId,
      name: tag.name,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    };
  }
}
