import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { TOKEN_SERVICE } from '../../constants/tokens';
import { TokenService } from '../../infrastructure/security/token.service';
import { type AuthenticatedRequest } from '../types';

export const AUTH_MESSAGES = {
  tokenMissing: 'Authentication token is missing',
  tokenInvalid: 'Invalid or expired authentication token',
} as const;

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException(AUTH_MESSAGES.tokenMissing);
    }

    try {
      const payload = await this.tokenService.verify(token);
      request.user = {
        id: payload.sub,
        email: payload.email,
      };
    } catch (error) {
      this.logger.warn(
        `Token verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException(AUTH_MESSAGES.tokenInvalid, {
        cause: error,
      });
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
