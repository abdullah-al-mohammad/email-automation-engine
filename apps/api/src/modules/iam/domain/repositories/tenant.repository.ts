import { type Tenant } from '../aggregates/tenant.aggregate';

export interface TenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findByIds(ids: string[]): Promise<Tenant[]>;
  save(tenant: Tenant): Promise<Tenant>;
  findByCreatorId(creatorId: string): Promise<Tenant[]>;
  delete(id: string): Promise<void>;
}
