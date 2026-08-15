import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { type Tenant } from '../../domain/aggregates/tenant.aggregate';

export const CurrentTenant = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ tenant?: Tenant }>();
  return data ? request.tenant?.[data as keyof Tenant] : request.tenant;
});
