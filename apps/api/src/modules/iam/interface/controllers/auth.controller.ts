import {
  type AuthResponse,
  type SigninDto,
  signinSchema,
  type SignupDto,
  signupSchema,
  type UserResponse,
} from '@email-automation-engine/shared';
import { Body, Controller, Get, Post, UseGuards, UsePipes } from '@nestjs/common';

import { ZodValidationPipe } from '../../../../infrastructure/pipes/zod-validation.pipe';
import { AuthService } from '../../application/services/auth.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthGuard } from '../guards/auth.guard';
import { type AuthenticatedUser } from '../types';

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

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserResponse> {
    return this.authService.getMe(user.id);
  }
}
