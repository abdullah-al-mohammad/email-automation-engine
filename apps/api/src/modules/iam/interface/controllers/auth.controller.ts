import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import {
  signupSchema,
  signinSchema,
  type SignupDto,
  type SigninDto,
  type AuthResponse,
} from '@email-automation-engine/shared';
import { AuthService } from '../../application/services/auth.service';
import { ZodValidationPipe } from '../../../../infrastructure/pipes/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UsePipes(new ZodValidationPipe(signupSchema))
  async signup(@Body() dto: SignupDto): Promise<AuthResponse> {
    return this.authService.signup(dto);
  }

  @Post('signin')
  @UsePipes(new ZodValidationPipe(signinSchema))
  async signin(@Body() dto: SigninDto): Promise<AuthResponse> {
    return this.authService.signin(dto);
  }
}
