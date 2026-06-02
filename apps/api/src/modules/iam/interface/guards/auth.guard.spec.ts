import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: { verifyAsync: Mock };
  let encryptionService: { decrypt: Mock };

  beforeEach(() => {
    jwtService = {
      verifyAsync: vi.fn(),
    };
    encryptionService = {
      decrypt: vi.fn(),
    };
    guard = new AuthGuard(
      jwtService as unknown as typeof guard['jwtService'],
      encryptionService as unknown as typeof guard['encryptionService']
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
    encryptionService.decrypt.mockReturnValue('decrypted-jwt');
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id-123', email: 'user@example.com' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted-token-xyz');
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('decrypted-jwt');
    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({ id: 'user-id-123', email: 'user@example.com' });
  });

  it('should throw UnauthorizedException if authorization header is missing', async () => {
    const context = createMockContext(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authentication token is missing'),
    );
  });

  it('should throw UnauthorizedException if header structure is not Bearer', async () => {
    const context = createMockContext('Basic token123');
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authentication token is missing'),
    );
  });

  it('should throw UnauthorizedException if decryption fails', async () => {
    const context = createMockContext('Bearer badtoken');
    encryptionService.decrypt.mockImplementation(() => {
      throw new Error('Decryption error');
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid or expired authentication token'),
    );
  });

  it('should throw UnauthorizedException if verification fails', async () => {
    const context = createMockContext('Bearer badtoken');
    encryptionService.decrypt.mockReturnValue('decrypted-jwt');
    jwtService.verifyAsync.mockRejectedValue(new Error('JWT expired'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid or expired authentication token'),
    );
  });

  it('should throw UnauthorizedException if payload structure is invalid', async () => {
    const context = createMockContext('Bearer token');
    encryptionService.decrypt.mockReturnValue('decrypted-jwt');
    // Payload missing 'email' property
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id-123' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid or expired authentication token'),
    );
  });
});
