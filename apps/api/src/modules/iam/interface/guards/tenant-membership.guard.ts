import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TENANT_REPOSITORY, TENANT_MEMBERSHIP_REPOSITORY } from '../../constants/tokens';
import { type TenantRepository } from '../../domain/repositories/tenant.repository';
import { type TenantMembershipRepository } from '../../domain/repositories/tenant-membership.repository';
import { type AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class TenantMembershipGuard implements CanActivate {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepo: TenantRepository,
    @Inject(TENANT_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: TenantMembershipRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    const tenantId = this.extractTenantId(request);
    if (!tenantId) {
      throw new BadRequestException(
        'Tenant ID is required in X-Tenant-Id header, route params, query, or body',
      );
    }

    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const membership = await this.membershipRepo.findByUserAndTenant(user.id, tenantId);
    if (!membership && tenant.creatorId !== user.id) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    // Attach resolved tenant and membership to the request for down-stream use (e.g. PermissionsGuard, CurrentTenant decorator)
    request.tenant = tenant;
    request.tenantMembership = membership;

    return true;
  }

  private extractTenantId(request: AuthenticatedRequest): string | undefined {
    const headerTenantId = request.headers['x-tenant-id'];
    return (
      (Array.isArray(headerTenantId) ? headerTenantId[0] : headerTenantId) ||
      request.params.tenantId ||
      request.params.id ||
      request.query.tenantId ||
      (request.body?.tenantId as string | undefined)
    );
  }
}
