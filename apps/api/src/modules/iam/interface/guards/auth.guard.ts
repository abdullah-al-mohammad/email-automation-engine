import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { TOKEN_SERVICE } from '../../constants/tokens';
import { TokenService } from '../../infrastructure/security/token.service';
import { type AuthenticatedRequest } from '../types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      const payload = await this.tokenService.verify(token);
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
