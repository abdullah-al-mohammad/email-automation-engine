import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type AuthResponse } from '@email-automation-engine/shared';
import { ENCRYPTION_SERVICE } from '../../constants/tokens';
import { EncryptionService } from './encryption.service';

export type TokenPayload = { sub: string; email: string };

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(ENCRYPTION_SERVICE)
    private readonly encryptionService: EncryptionService,
  ) {}

  async issue(sub: string, email: string): Promise<AuthResponse> {
    const signedToken = await this.jwt.signAsync({ sub, email });
    const accessToken = this.encryptionService.encrypt(signedToken);
    return { accessToken };
  }

  async verify(token: string): Promise<TokenPayload> {
    const decrypted = this.encryptionService.decrypt(token);
    const payload: unknown = await this.jwt.verifyAsync(decrypted);

    if (!isTokenPayload(payload)) {
      throw new UnauthorizedException('Invalid token payload structure');
    }

    return { sub: payload.sub, email: payload.email };
  }
}

function isTokenPayload(value: unknown): value is TokenPayload {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.sub === 'string' && typeof record.email === 'string';
}
