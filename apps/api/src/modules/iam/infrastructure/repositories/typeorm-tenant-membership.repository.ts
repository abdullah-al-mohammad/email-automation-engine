import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantMembership } from '../../domain/aggregates/tenant-membership.aggregate';
import { type TenantMembershipRepository } from '../../domain/repositories/tenant-membership.repository';

@Injectable()
export class TypeOrmTenantMembershipRepository implements TenantMembershipRepository {
  constructor(
    @InjectRepository(TenantMembership)
    private readonly repo: Repository<TenantMembership>,
  ) {}

  async findByUserAndTenant(userId: string, tenantId: string): Promise<TenantMembership | null> {
    return this.repo.findOne({ where: { userId, tenantId } });
  }

  async findMembershipsByUser(userId: string): Promise<TenantMembership[]> {
    return this.repo.find({ where: { userId } });
  }

  async findMembershipsByTenant(tenantId: string): Promise<TenantMembership[]> {
    return this.repo.find({ where: { tenantId } });
  }

  async save(membership: TenantMembership): Promise<TenantMembership> {
    return this.repo.save(membership);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
