import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantInvitation } from '../../domain/aggregates/tenant-invitation.aggregate';
import { TenantInvitationRepository } from '../../domain/repositories/tenant-invitation.repository';

@Injectable()
export class TypeOrmTenantInvitationRepository implements TenantInvitationRepository {
  constructor(
    @InjectRepository(TenantInvitation)
    private readonly repository: Repository<TenantInvitation>,
  ) {}

  async findById(id: string): Promise<TenantInvitation | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAllByTenantId(tenantId: string): Promise<TenantInvitation[]> {
    return this.repository.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async save(invitation: TenantInvitation): Promise<TenantInvitation> {
    return this.repository.save(invitation);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
