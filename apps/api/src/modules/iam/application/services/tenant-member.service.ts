import { type TenantMemberResponse } from '@email-automation-engine/shared';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { TENANT_MEMBERSHIP_REPOSITORY, USER_REPOSITORY } from '../../constants/tokens';
import { TenantMembershipRepository } from '../../domain/repositories/tenant-membership.repository';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class TenantMemberService {
  constructor(
    @Inject(TENANT_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: TenantMembershipRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {}

  async findAllByTenantId(tenantId: string): Promise<TenantMemberResponse[]> {
    const memberships = await this.membershipRepo.findMembershipsByTenant(tenantId);

    // Fetch users to populate email
    const responses: TenantMemberResponse[] = [];
    for (const m of memberships) {
      const user = await this.userRepo.findById(m.userId);
      responses.push({
        id: m.id,
        tenantId: m.tenantId,
        userId: m.userId,
        roleId: m.roleId,
        status: 'active',
        user: user ? { email: user.email } : undefined,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      });
    }

    return responses;
  }

  async delete(tenantId: string, userId: string): Promise<void> {
    const membership = await this.membershipRepo.findByUserAndTenant(userId, tenantId);
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }
    await this.membershipRepo.delete(membership.id);
  }
}
