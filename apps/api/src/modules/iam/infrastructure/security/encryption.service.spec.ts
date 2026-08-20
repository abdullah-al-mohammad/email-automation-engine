import * as crypto from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    service = new EncryptionService(crypto.randomBytes(32));
  });

  describe('encrypt', () => {
    it('returns the encrypted value in three parts', () => {
      const result = service.encrypt('hello world');
      const parts = result.split(':');

      expect(parts).toHaveLength(3);

      const [iv, authTag, ciphertext] = parts;
      expect(iv).toHaveLength(24); // 12 bytes = 24 hex chars
      expect(authTag).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(ciphertext.length).toBeGreaterThan(0);
    });

    it('produces a different result each time for the same input', () => {
      const first = service.encrypt('same input');
      const second = service.encrypt('same input');

      expect(first).not.toEqual(second);
    });

    it('round-trips an empty string', () => {
      const encrypted = service.encrypt('');
      const parts = encrypted.split(':');

      expect(parts).toHaveLength(3);
      expect(service.decrypt(encrypted)).toBe('');
    });

    it('round-trips long input', () => {
      const longInput = 'a'.repeat(10_000);
      const encrypted = service.encrypt(longInput);

      expect(service.decrypt(encrypted)).toBe(longInput);
    });
  });

  describe('decrypt', () => {
    it('recovers the original plaintext after encryption', () => {
      const plaintext = 'jwt-token-payload-here';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('round-trips unicode content', () => {
      const plaintext = 'user@example.com — 日本語テスト';
      const encrypted = service.encrypt(plaintext);

      expect(service.decrypt(encrypted)).toBe(plaintext);
    });
  });

  describe('tamper detection', () => {
    it('rejects a tampered IV', () => {
      const encrypted = service.encrypt('secret');
      const [iv, authTag, ciphertext] = encrypted.split(':');

      const tamperedIv = (iv[0] === 'a' ? 'b' : 'a') + iv.slice(1);
      const tampered = `${tamperedIv}:${authTag}:${ciphertext}`;

      expect(() => service.decrypt(tampered)).toThrow();
    });

    it('rejects a tampered auth tag', () => {
      const encrypted = service.encrypt('secret');
      const [iv, authTag, ciphertext] = encrypted.split(':');

      const tamperedTag = (authTag[0] === 'a' ? 'b' : 'a') + authTag.slice(1);
      const tampered = `${iv}:${tamperedTag}:${ciphertext}`;

      expect(() => service.decrypt(tampered)).toThrow();
    });

    it('rejects tampered ciphertext', () => {
      const encrypted = service.encrypt('secret');
      const [iv, authTag, ciphertext] = encrypted.split(':');

      const tamperedCiphertext = (ciphertext[0] === 'a' ? 'b' : 'a') + ciphertext.slice(1);
      const tampered = `${iv}:${authTag}:${tamperedCiphertext}`;

      expect(() => service.decrypt(tampered)).toThrow();
    });

    it('rejects malformed input', () => {
      expect(() => service.decrypt('onlyone')).toThrow();
      expect(() => service.decrypt('two:parts')).toThrow();
    });

    it('rejects data encrypted with a different key', () => {
      const otherService = new EncryptionService(crypto.randomBytes(32));

      const encrypted = otherService.encrypt('secret');

      expect(() => service.decrypt(encrypted)).toThrow();
    });
  });

  describe('key validation', () => {
    it('fails fast when the key is not exactly 32 bytes', () => {
      expect(() => new EncryptionService(crypto.randomBytes(16))).toThrow(/expected 32 bytes/);
    });
  });
});
