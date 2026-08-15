import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { TOKEN_SERVICE } from '../../constants/tokens';
import { TokenService } from '../../infrastructure/security/token.service';
import { type AuthenticatedRequest } from '../types';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.parseBearerHeader(request);
    if (!token) {
      throw new UnauthorizedException('Authentication token is missing or invalid');
    }

    request.user = await this.authenticate(token);
    return true;
  }

  private async authenticate(token: string): Promise<{ id: string; email: string }> {
    try {
      const payload = await this.tokenService.verify(token);
      return { id: payload.sub, email: payload.email };
    } catch (error) {
      this.logger.warn(
        `Token verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException('Invalid or expired authentication token', {
        cause: error,
      });
    }
  }

  private parseBearerHeader(request: Pick<AuthenticatedRequest, 'headers'>): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader || Array.isArray(authHeader)) return undefined;
    const [type, token, ...extra] = authHeader.split(' ');
    if (type !== 'Bearer' || !token || extra.length) return undefined;
    return token;
  }
}
