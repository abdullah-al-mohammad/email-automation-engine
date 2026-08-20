import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { EncryptionService } from './encryption.service';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let jwt: { signAsync: Mock; verifyAsync: Mock };
  let encryption: { encrypt: Mock; decrypt: Mock };

  beforeEach(() => {
    jwt = {
      signAsync: vi.fn().mockResolvedValue('signed-jwt-token'),
      verifyAsync: vi.fn(),
    };
    encryption = {
      encrypt: vi.fn().mockReturnValue('encrypted-token'),
      decrypt: vi.fn().mockReturnValue('decrypted-jwt'),
    };
    service = new TokenService(
      jwt as unknown as JwtService,
      encryption as unknown as EncryptionService,
    );
  });

  describe('issue', () => {
    it('returns an encrypted token for the user', async () => {
      const result = await service.issue('user-id', 'user@example.com');

      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: 'user-id',
        email: 'user@example.com',
      });
      expect(encryption.encrypt).toHaveBeenCalledWith('signed-jwt-token');
      expect(result).toEqual({ accessToken: 'encrypted-token' });
    });
  });

  describe('verify', () => {
    it('returns the user details for a valid token', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'user-id', email: 'user@example.com' });

      const result = await service.verify('encrypted-token');

      expect(encryption.decrypt).toHaveBeenCalledWith('encrypted-token');
      expect(jwt.verifyAsync).toHaveBeenCalledWith('decrypted-jwt');
      expect(result).toEqual({ sub: 'user-id', email: 'user@example.com' });
    });

    it('rejects a token without a user id', async () => {
      jwt.verifyAsync.mockResolvedValue({ email: 'user@example.com' });

      await expect(service.verify('encrypted-token')).rejects.toThrow(
        'Invalid token payload structure',
      );
    });

    it('rejects a token without an email', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'user-id' });

      await expect(service.verify('encrypted-token')).rejects.toThrow(
        'Invalid token payload structure',
      );
    });

    it('rejects an invalid or expired token', async () => {
      jwt.verifyAsync.mockRejectedValue(new Error('JWT expired'));

      await expect(service.verify('encrypted-token')).rejects.toThrow('JWT expired');
    });

    it('rejects a token that cannot be decrypted', async () => {
      encryption.decrypt.mockImplementation(() => {
        throw new Error('Decryption error');
      });

      await expect(service.verify('encrypted-token')).rejects.toThrow('Decryption error');
    });
  });

  describe('roundtrip with real JwtService and EncryptionService', () => {
    it('round-trips a token with the real services', async () => {
      const encryptionService = new EncryptionService(crypto.randomBytes(32));
      const jwtService = new JwtService({
        secret: 'test-secret',
        signOptions: { expiresIn: '1h' },
      });

      const service = new TokenService(jwtService, encryptionService);

      const issued = await service.issue('user-id', 'user@example.com');
      const payload = await service.verify(issued.accessToken);

      expect(payload).toEqual({ sub: 'user-id', email: 'user@example.com' });
    });
  });
});
