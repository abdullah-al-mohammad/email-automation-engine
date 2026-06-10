import { type TenantInvitation } from '../aggregates/tenant-invitation.aggregate';

export interface TenantInvitationRepository {
  findById(id: string): Promise<TenantInvitation | null>;
  findAllByTenantId(tenantId: string): Promise<TenantInvitation[]>;
  save(invitation: TenantInvitation): Promise<TenantInvitation>;
  delete(id: string): Promise<void>;
}
