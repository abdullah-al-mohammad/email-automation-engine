import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TENANT_MEMBERSHIP_REPOSITORY } from '../../constants/tokens';
import { TenantMembershipRepository } from '../../domain/repositories/tenant-membership.repository';
import { type TenantMemberResponse } from '@email-automation-engine/shared';

@Injectable()
export class TenantMemberService {
  constructor(
    @Inject(TENANT_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: TenantMembershipRepository,
  ) {}

  async findAllByTenantId(tenantId: string): Promise<TenantMemberResponse[]> {
    const memberships = await this.membershipRepo.findMembershipsByTenant(tenantId);
    return memberships.map(m => ({
      id: m.id,
      tenantId: m.tenantId,
      userId: m.userId,
      roleId: m.roleId,
      status: 'active',
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));
  }

  async delete(tenantId: string, userId: string): Promise<void> {
    const membership = await this.membershipRepo.findByUserAndTenant(userId, tenantId);
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }
    await this.membershipRepo.delete(membership.id);
  }
}
