import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import { UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../../domain/aggregates/user.aggregate';
import { BCRYPT_SALT_ROUNDS } from '../../../../infrastructure/config/config-keys';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: { findByEmail: Mock; save: Mock };
  let jwtService: { signAsync: Mock };
  let configService: { getOrThrow: Mock };
  let encryptionService: { encrypt: Mock; decrypt: Mock };

  const existingUser = new User();
  existingUser.id = 'user-uuid';
  existingUser.email = 'john@example.com';
  existingUser.passwordHash = '$2b$10$hashedvalue';

  beforeEach(() => {
    vi.clearAllMocks();

    userRepo = {
      findByEmail: vi.fn(),
      save: vi.fn(),
    };

    jwtService = {
      signAsync: vi.fn().mockResolvedValue('signed-jwt-token'),
    };

    configService = {
      getOrThrow: vi.fn().mockImplementation((key) => {
        if (key === BCRYPT_SALT_ROUNDS) return 10;
        throw new Error(`Missing key ${key}`);
      }),
    };

    encryptionService = {
      encrypt: vi.fn().mockReturnValue('opaque-encrypted-token'),
      decrypt: vi.fn(),
    };

    service = new AuthService(
      userRepo as unknown as (typeof service)['userRepo'],
      encryptionService as unknown as (typeof service)['encryptionService'],
      jwtService as unknown as (typeof service)['jwt'],
      configService as unknown as (typeof service)['config'],
    );
  });

  describe('signup', () => {
    it('should hash password and save new user', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockImplementation(() => Promise.resolve('$2b$10$hashednewpass'));
      userRepo.save.mockImplementation((u: User) => Promise.resolve({ ...u, id: 'new-id' }));

      const result = await service.signup({
        email: 'alice@example.com',
        password: 'password123',
      });

      expect(userRepo.findByEmail).toHaveBeenCalledWith('alice@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userRepo.save).toHaveBeenCalled();
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'new-id',
        email: 'alice@example.com',
      });
      expect(result).toEqual({ accessToken: 'opaque-encrypted-token' });
    });

    it('should throw ConflictException if email exists', async () => {
      userRepo.findByEmail.mockResolvedValue(existingUser);

      await expect(
        service.signup({
          email: 'john@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should normalize email before checking uniqueness during signup', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockImplementation(() => Promise.resolve('$2b$10$hashednewpass'));
      userRepo.save.mockImplementation((u: User) => Promise.resolve({ ...u, id: 'new-id' }));

      await service.signup({
        email: '  ALICE@example.com  ',
        password: 'password123',
      });

      expect(userRepo.findByEmail).toHaveBeenCalledWith('alice@example.com');
    });
  });

  describe('signin', () => {
    it('should return token if credentials are valid', async () => {
      userRepo.findByEmail.mockResolvedValue(existingUser);
      vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(true));

      const result = await service.signin({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(userRepo.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', '$2b$10$hashedvalue');
      expect(result).toEqual({ accessToken: 'opaque-encrypted-token' });
    });

    it('should normalize email during signin', async () => {
      userRepo.findByEmail.mockResolvedValue(existingUser);
      vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(true));

      await service.signin({
        email: '  JOHN@example.com  ',
        password: 'password123',
      });

      expect(userRepo.findByEmail).toHaveBeenCalledWith('john@example.com');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(
        service.signin({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password incorrect', async () => {
      userRepo.findByEmail.mockResolvedValue(existingUser);
      vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(false));

      await expect(
        service.signin({
          email: 'john@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user status is blocked', async () => {
      const blockedUser = new User();
      blockedUser.id = 'user-uuid';
      blockedUser.email = 'john@example.com';
      blockedUser.passwordHash = '$2b$10$hashedvalue';
      blockedUser.status = 'blocked';

      userRepo.findByEmail.mockResolvedValue(blockedUser);
      vi.mocked(bcrypt.compare).mockImplementation(() => Promise.resolve(true));

      await expect(
        service.signin({
          email: 'john@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(new ForbiddenException('Your account has been blocked'));
    });
  });
});
