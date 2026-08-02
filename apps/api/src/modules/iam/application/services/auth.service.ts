import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import {
  type SignupDto,
  type SigninDto,
  type AuthResponse,
  type UserResponse,
  USER_STATUS,
} from '@email-automation-engine/shared';
import { USER_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE } from '../../constants/tokens';
import { type UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/aggregates/user.aggregate';
import { PasswordHasher } from '../../infrastructure/security/password-hasher.service';
import { TokenService } from '../../infrastructure/security/token.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Account already exists.');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);

    const user = new User();
    user.email = email;
    user.passwordHash = passwordHash;
    user.status = USER_STATUS.NEW;

    const savedUser = await this.userRepo.save(user);
    return this.tokenService.issue(savedUser.id, savedUser.email);
  }

  async signin(dto: SigninDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.userRepo.findByEmail(email);

    // Timing attack mitigation: compare against a dummy hash if user doesn't exist
    const passwordMatched = user
      ? await this.passwordHasher.compare(dto.password, user.passwordHash)
      : await this.passwordHasher.compareDummy(dto.password);

    if (!user || !passwordMatched) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === USER_STATUS.BLOCKED) {
      throw new ForbiddenException('Your account has been blocked');
    }

    return this.tokenService.issue(user.id, user.email);
  }

  async getMe(userId: string): Promise<UserResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.toResponse(user);
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private toResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
