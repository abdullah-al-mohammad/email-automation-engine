import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

import { JWT_ENCRYPTION_KEY } from '../../../../infrastructure/config/config-keys';
import { JWT_ENCRYPTION_KEY_VALUE } from '../../constants/tokens';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard: 96-bit IV
const SEPARATOR = ':';
const KEY_LENGTH = 32; // AES-256 requires a 256-bit key

export class InvalidCiphertextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCiphertextError';
  }
}

// Format: iv:authTag:ciphertext
function serialize(iv: Buffer, authTag: Buffer, ciphertext: Buffer): string {
  return [iv, authTag, ciphertext].map((b) => b.toString('hex')).join(SEPARATOR);
}

function parse(payload: string): { iv: Buffer; authTag: Buffer; ciphertext: Buffer } {
  const parts = payload.split(SEPARATOR);
  if (parts.length !== 3) {
    throw new InvalidCiphertextError('expected iv:authTag:ciphertext');
  }
  const [ivHex, authTagHex, ciphertextHex] = parts;
  return {
    iv: Buffer.from(ivHex ?? '', 'hex'),
    authTag: Buffer.from(authTagHex ?? '', 'hex'),
    ciphertext: Buffer.from(ciphertextHex ?? '', 'hex'),
  };
}

@Injectable()
export class EncryptionService {
  constructor(@Inject(JWT_ENCRYPTION_KEY_VALUE) private readonly key: Buffer) {
    if (this.key.length !== KEY_LENGTH) {
      throw new Error(
        `Invalid ${JWT_ENCRYPTION_KEY}: expected ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex chars), got ${this.key.length}`,
      );
    }
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

    return serialize(iv, cipher.getAuthTag(), encrypted);
  }

  decrypt(payload: string): string {
    try {
      const parsed = parse(payload);
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, parsed.iv);
      decipher.setAuthTag(parsed.authTag);
      return Buffer.concat([decipher.update(parsed.ciphertext), decipher.final()]).toString('utf8');
    } catch (error) {
      if (error instanceof InvalidCiphertextError) throw error;
      throw new InvalidCiphertextError('failed to decrypt: data may be tampered or corrupted');
    }
  }
}
