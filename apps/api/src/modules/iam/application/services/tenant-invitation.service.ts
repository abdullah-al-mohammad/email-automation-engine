import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TENANT_INVITATION_REPOSITORY } from '../../constants/tokens';
import { TenantInvitationRepository } from '../../domain/repositories/tenant-invitation.repository';
import { TenantInvitation } from '../../domain/aggregates/tenant-invitation.aggregate';
import { type TenantInvitationResponse, type CreateTenantInvitationDto } from '@email-automation-engine/shared';
import * as crypto from 'crypto';

@Injectable()
export class TenantInvitationService {
  constructor(
    @Inject(TENANT_INVITATION_REPOSITORY)
    private readonly invitationRepo: TenantInvitationRepository,
  ) {}

  async findAllByTenantId(tenantId: string): Promise<TenantInvitationResponse[]> {
    const invitations = await this.invitationRepo.findAllByTenantId(tenantId);
    return invitations.map(i => this.mapToResponse(i));
  }

  async create(tenantId: string, senderId: string, dto: CreateTenantInvitationDto): Promise<TenantInvitationResponse> {
    const invitation = new TenantInvitation();
    invitation.tenantId = tenantId;
    invitation.senderId = senderId;
    invitation.roleId = dto.roleId;
    invitation.email = dto.email;
    invitation.message = dto.message ?? null;
    invitation.invitationToken = crypto.randomBytes(32).toString('hex');
    
    const saved = await this.invitationRepo.save(invitation);
    return this.mapToResponse(saved);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const invitation = await this.invitationRepo.findById(id);
    if (!invitation || invitation.tenantId !== tenantId) {
      throw new NotFoundException('Invitation not found');
    }
    await this.invitationRepo.delete(id);
  }

  private mapToResponse(invitation: TenantInvitation): TenantInvitationResponse {
    return {
      id: invitation.id,
      tenantId: invitation.tenantId,
      senderId: invitation.senderId,
      roleId: invitation.roleId,
      email: invitation.email,
      invitationToken: invitation.invitationToken,
      message: invitation.message,
      createdAt: invitation.createdAt.toISOString(),
      updatedAt: invitation.updatedAt.toISOString(),
    };
  }
}
