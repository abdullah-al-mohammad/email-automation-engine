import type { Tag } from '../aggregates/tag.aggregate';

export interface TagRepository {
  findById(id: string): Promise<Tag | null>;
  findAllByTenantId(tenantId: string): Promise<Tag[]>;
  findByTenantIdAndName(tenantId: string, name: string): Promise<Tag | null>;
  save(tag: Tag): Promise<Tag>;
}
