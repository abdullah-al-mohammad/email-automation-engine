import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ENCRYPTION_SERVICE } from '../../constants/tokens';
import { EncryptionService } from '../../infrastructure/security/encryption.service';
import { type AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(ENCRYPTION_SERVICE)
    private readonly encryptionService: EncryptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      const decrypted = this.encryptionService.decrypt(token);
      const payload = (await this.jwtService.verifyAsync(decrypted)) as Record<
        string,
        unknown
      > | null;

      if (!payload || typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
        throw new Error('Invalid token payload structure');
      }

      request.user = {
        id: payload.sub,
        email: payload.email,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    return true;
  }

  private extractTokenFromHeader(request: AuthenticatedRequest): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader || Array.isArray(authHeader)) return undefined;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
