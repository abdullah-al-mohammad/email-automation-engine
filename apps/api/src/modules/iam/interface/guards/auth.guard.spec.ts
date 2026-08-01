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

  it('should activate if header is valid and token is verified', async () => {
    const context = createMockContext('Bearer encrypted-token-xyz');
    tokenService.verify.mockResolvedValue({ sub: 'user-id-123', email: 'user@example.com' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(tokenService.verify).toHaveBeenCalledWith('encrypted-token-xyz');
    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({ id: 'user-id-123', email: 'user@example.com' });
  });

  it('should throw UnauthorizedException if authorization header is missing', async () => {
    const context = createMockContext(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authentication token is missing or invalid'),
    );
  });

  it('should throw UnauthorizedException if header scheme is not Bearer', async () => {
    const context = createMockContext('Basic token123');
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authentication token is missing or invalid'),
    );
  });

  it('should throw UnauthorizedException if header has extra segments', async () => {
    const context = createMockContext('Bearer token extra');
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authentication token is missing or invalid'),
    );
  });

  it('should throw UnauthorizedException if token verification fails', async () => {
    const context = createMockContext('Bearer badtoken');
    tokenService.verify.mockRejectedValue(new Error('JWT expired'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid or expired authentication token', {
        cause: new Error('JWT expired'),
      }),
    );
  });

  it('should throw UnauthorizedException if payload structure is invalid', async () => {
    const context = createMockContext('Bearer token');
    tokenService.verify.mockRejectedValue(new Error('Invalid token payload structure'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid or expired authentication token', {
        cause: new Error('Invalid token payload structure'),
      }),
    );
  });
});
