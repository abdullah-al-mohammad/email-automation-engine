import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let tokenService: { verify: Mock };

  beforeEach(() => {
    tokenService = {
      verify: vi.fn(),
    };
    guard = new AuthGuard(
      tokenService as unknown as (typeof guard)['tokenService'],
    );
  });

  const createMockContext = (authHeader?: string): ExecutionContext => {
    const request = {
      headers: {
        authorization: authHeader,
      },
      user: undefined,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('allows a valid Bearer token that verifies', async () => {
    const context = createMockContext('Bearer encrypted-token-xyz');
    tokenService.verify.mockResolvedValue({ sub: 'user-id-123', email: 'user@example.com' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(tokenService.verify).toHaveBeenCalledWith('encrypted-token-xyz');
    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({ id: 'user-id-123', email: 'user@example.com' });
  });

  it('rejects the request without an Authorization header', async () => {
    const context = createMockContext(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authentication token is missing or invalid'),
    );
  });

  it('rejects a token without the Bearer scheme', async () => {
    const context = createMockContext('Basic token123');
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authentication token is missing or invalid'),
    );
  });

  it('rejects a token with extra parts', async () => {
    const context = createMockContext('Bearer token extra');
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authentication token is missing or invalid'),
    );
  });

  it('rejects a token that fails verification', async () => {
    const context = createMockContext('Bearer badtoken');
    tokenService.verify.mockRejectedValue(new Error('JWT expired'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid or expired authentication token', {
        cause: new Error('JWT expired'),
      }),
    );
  });

  it('rejects a token with an invalid payload', async () => {
    const context = createMockContext('Bearer token');
    tokenService.verify.mockRejectedValue(new Error('Invalid token payload structure'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid or expired authentication token', {
        cause: new Error('Invalid token payload structure'),
      }),
    );
  });
});
