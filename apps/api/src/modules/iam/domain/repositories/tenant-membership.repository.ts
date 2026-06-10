import { type TenantMembership } from '../aggregates/tenant-membership.aggregate';

export interface TenantMembershipRepository {
  findByUserAndTenant(userId: string, tenantId: string): Promise<TenantMembership | null>;
  findMembershipsByUser(userId: string): Promise<TenantMembership[]>;
  findMembershipsByTenant(tenantId: string): Promise<TenantMembership[]>;
  save(membership: TenantMembership): Promise<TenantMembership>;
  delete(id: string): Promise<void>;
}
