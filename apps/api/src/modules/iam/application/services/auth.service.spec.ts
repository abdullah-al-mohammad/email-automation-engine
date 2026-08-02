import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import { UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../../domain/aggregates/user.aggregate';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: { findByEmail: Mock; findById: Mock; save: Mock };
  let passwordHasher: { hash: Mock; compare: Mock; compareDummy: Mock };
  let tokenService: { issue: Mock };

  const existingUser = new User();
  existingUser.id = 'user-uuid';
  existingUser.email = 'john@example.com';
  existingUser.passwordHash = '$2b$10$hashedvalue';

  beforeEach(() => {
    vi.clearAllMocks();

    userRepo = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
    };

    passwordHasher = {
      hash: vi.fn().mockResolvedValue('$2b$10$hashednewpass'),
      compare: vi.fn().mockResolvedValue(true),
      compareDummy: vi.fn().mockResolvedValue(false),
    };

    tokenService = {
      issue: vi.fn().mockResolvedValue({ accessToken: 'opaque-token' }),
    };

    service = new AuthService(
      userRepo as unknown as (typeof service)['userRepo'],
      passwordHasher as unknown as (typeof service)['passwordHasher'],
      tokenService as unknown as (typeof service)['tokenService'],
    );
  });

  describe('signup', () => {
    it('creates a user and returns an access token', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.save.mockImplementation((u: User) => Promise.resolve({ ...u, id: 'new-id' }));

      const result = await service.signup({
        email: 'alice@example.com',
        password: 'password123',
      });

      expect(userRepo.findByEmail).toHaveBeenCalledWith('alice@example.com');
      expect(passwordHasher.hash).toHaveBeenCalledWith('password123');
      expect(userRepo.save).toHaveBeenCalled();
      expect(tokenService.issue).toHaveBeenCalledWith('new-id', 'alice@example.com');
      expect(result).toEqual({ accessToken: 'opaque-token' });
    });

    it('rejects signup when the email is already registered', async () => {
      userRepo.findByEmail.mockResolvedValue(existingUser);

      await expect(
        service.signup({
          email: 'john@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('accepts emails with spaces and different casing during signup', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.save.mockImplementation((u: User) => Promise.resolve({ ...u, id: 'new-id' }));

      await service.signup({
        email: '  ALICE@example.com  ',
        password: 'password123',
      });

      expect(userRepo.findByEmail).toHaveBeenCalledWith('alice@example.com');
    });
  });

  describe('signin', () => {
    it('returns an access token when the credentials are valid', async () => {
      userRepo.findByEmail.mockResolvedValue(existingUser);

      const result = await service.signin({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(userRepo.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(passwordHasher.compare).toHaveBeenCalledWith('password123', '$2b$10$hashedvalue');
      expect(result).toEqual({ accessToken: 'opaque-token' });
    });

    it('accepts emails with spaces and different casing during signin', async () => {
      userRepo.findByEmail.mockResolvedValue(existingUser);

      await service.signin({
        email: '  JOHN@example.com  ',
        password: 'password123',
      });

      expect(userRepo.findByEmail).toHaveBeenCalledWith('john@example.com');
    });

    it('rejects signin when the user is not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(
        service.signin({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(passwordHasher.compareDummy).toHaveBeenCalledWith('password123');
      expect(passwordHasher.compare).not.toHaveBeenCalled();
    });

    it('rejects signin when the password is incorrect', async () => {
      userRepo.findByEmail.mockResolvedValue(existingUser);
      passwordHasher.compare.mockResolvedValue(false);

      await expect(
        service.signin({
          email: 'john@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects signin when the account is blocked', async () => {
      const blockedUser = new User();
      blockedUser.id = 'user-uuid';
      blockedUser.email = 'john@example.com';
      blockedUser.passwordHash = '$2b$10$hashedvalue';
      blockedUser.status = 'blocked';

      userRepo.findByEmail.mockResolvedValue(blockedUser);

      await expect(
        service.signin({
          email: 'john@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(new ForbiddenException('Your account has been blocked'));
    });
  });

  describe('getMe', () => {
    it('returns the user profile', async () => {
      const u = new User();
      u.id = 'u1';
      u.email = 'alice@example.com';
      u.status = 'approved';
      u.createdAt = new Date('2026-01-01T00:00:00Z');
      u.updatedAt = new Date('2026-01-01T00:00:00Z');

      userRepo.findById.mockResolvedValue(u);

      const result = await service.getMe('u1');

      expect(userRepo.findById).toHaveBeenCalledWith('u1');
      expect(result).toEqual({
        id: 'u1',
        email: 'alice@example.com',
        status: 'approved',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('rejects getMe when the user is not found', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(service.getMe('bad-uuid')).rejects.toThrow(UnauthorizedException);
    });
  });
});
