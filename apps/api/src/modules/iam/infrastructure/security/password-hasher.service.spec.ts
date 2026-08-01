import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { PasswordHasher } from './password-hasher.service';
import { BCRYPT_SALT_ROUNDS } from '../../../../infrastructure/config/config-keys';

describe('PasswordHasher', () => {
  let service: PasswordHasher;
  const getOrThrow = vi.fn().mockReturnValue(10);

  beforeEach(() => {
    const configMock = { getOrThrow } as unknown as ConfigService;
    service = new PasswordHasher(configMock);
  });

  describe('hash', () => {
    it('hashes a plain password into a bcrypt string that no longer looks like it', async () => {
      const hash = await service.hash('password123');

      expect(hash).toMatch(/^\$2[ab]\$10\$/);
      expect(hash).not.toBe('password123');
      expect(getOrThrow).toHaveBeenCalledWith(BCRYPT_SALT_ROUNDS);
    });
  });

  describe('compare', () => {
    it('confirms a password that matches its hash', async () => {
      const hash = await service.hash('password123');
      await expect(service.compare('password123', hash)).resolves.toBe(true);
    });

    it('rejects a password that does not match its hash', async () => {
      const hash = await service.hash('password123');
      await expect(service.compare('wrong-password', hash)).resolves.toBe(false);
    });

    it('rejects a password when the stored hash is malformed instead of crashing', async () => {
      await expect(service.compare('password123', 'not-a-valid-hash')).resolves.toBe(false);
    });

    it('rejects a password when the stored hash is empty instead of crashing', async () => {
      await expect(service.compare('password123', '')).resolves.toBe(false);
    });
  });

  describe('compareDummy', () => {
    it('rejects any password when comparing against the dummy hash', async () => {
      await expect(service.compareDummy('password123')).resolves.toBe(false);
    });

    it('never matches a password, even one that hashes correctly', async () => {
      const hash = await service.hash('password123');
      await expect(service.compareDummy('password123')).resolves.toBe(false);
      expect(hash).not.toBe('');
    });
  });
});
