import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { BCRYPT_SALT_ROUNDS } from '../../../../infrastructure/config/config-keys';

@Injectable()
export class PasswordHasher {
  private readonly saltRounds: number;
  private readonly dummyHash = '$2b$10$ckuRMbA53QkLioHjmr8cKuLFSwFgrfQHNybywg.uzuAfWysfMmiRm';

  constructor(private readonly config: ConfigService) {
    this.saltRounds = this.config.getOrThrow<number>(BCRYPT_SALT_ROUNDS);
  }

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plain, hashed);
    } catch {
      return false;
    }
  }

  async compareDummy(plain: string): Promise<boolean> {
    return this.compare(plain, this.dummyHash);
  }
}
