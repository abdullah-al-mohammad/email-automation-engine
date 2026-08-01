import { type Tenant } from '../domain/aggregates/tenant.aggregate';
import { type TenantMembership } from '../domain/aggregates/tenant-membership.aggregate';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  params: Record<string, string | undefined>;
  query: Record<string, string | undefined>;
  body?: Record<string, unknown>;
  user?: AuthenticatedUser;
  tenant?: Tenant;
  tenantMembership?: TenantMembership | null;
}
