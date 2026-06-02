import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  type SignupDto,
  type SigninDto,
  type AuthResponse,
  USER_NEW,
  USER_BLOCKED,
} from '@email-automation-engine/shared';
import { USER_REPOSITORY, ENCRYPTION_SERVICE } from '../../constants/tokens';
import { type UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/aggregates/user.aggregate';
import { EncryptionService } from '../../infrastructure/security/encryption.service';
import { BCRYPT_SALT_ROUNDS } from '../../../../infrastructure/config/config-keys';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    @Inject(ENCRYPTION_SERVICE)
    private readonly encryptionService: EncryptionService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const emailNormalized = dto.email.toLowerCase().trim();
    const existingUser = await this.userRepo.findByEmail(emailNormalized);
    if (existingUser) {
      throw new ConflictException('This email address is already in use');
    }

    const saltRounds = this.config.getOrThrow<number>(BCRYPT_SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = new User();
    user.email = emailNormalized;
    user.passwordHash = passwordHash;
    user.status = USER_NEW;

    const savedUser = await this.userRepo.save(user);
    return this.issueToken(savedUser);
  }

  async signin(dto: SigninDto): Promise<AuthResponse> {
    const emailNormalized = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(emailNormalized);

    // Timing attack mitigation: run bcrypt comparison using a dummy hash if user doesn't exist
    const dummyHash = '$2b$10$ckuRMbA53QkLioHjmr8cKuLFSwFgrfQHNybywg.uzuAfWysfMmiRm';
    const passwordHash = user?.passwordHash ?? dummyHash;
    const passwordMatched = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !passwordMatched) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === USER_BLOCKED) {
      throw new ForbiddenException('Your account has been blocked');
    }

    return this.issueToken(user);
  }

  private async issueToken(user: User): Promise<AuthResponse> {
    const signedToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });

    const accessToken = this.encryptionService.encrypt(signedToken);
    return { accessToken };
  }
}
