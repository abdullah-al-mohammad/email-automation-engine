import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BCRYPT_SALT_ROUNDS } from '../../../../infrastructure/config/config-keys';
import { PasswordHasher } from './password-hasher.service';

describe('PasswordHasher', () => {
  let service: PasswordHasher;
  const getOrThrow = vi.fn().mockReturnValue(10);

  beforeEach(() => {
    const configMock = { getOrThrow } as unknown as ConfigService;
    service = new PasswordHasher(configMock);
  });

  describe('hash', () => {
    it('turns a password into an unrecognizable hash', async () => {
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

    it('handles a malformed stored hash gracefully', async () => {
      await expect(service.compare('password123', 'not-a-valid-hash')).resolves.toBe(false);
    });

    it('handles an empty stored hash gracefully', async () => {
      await expect(service.compare('password123', '')).resolves.toBe(false);
    });
  });

  describe('compareDummy', () => {
    it('rejects every password against the dummy hash', async () => {
      await expect(service.compareDummy('password123')).resolves.toBe(false);
    });

    it('never matches, even a correctly hashed password', async () => {
      const hash = await service.hash('password123');
      await expect(service.compareDummy('password123')).resolves.toBe(false);
      expect(hash).not.toBe('');
    });
  });
});
