import { Controller, Post, Get, Body, UsePipes, UseGuards } from '@nestjs/common';
import {
  signupSchema,
  signinSchema,
  type SignupDto,
  type SigninDto,
  type AuthResponse,
  type UserResponse,
} from '@email-automation-engine/shared';
import { AuthService } from '../../application/services/auth.service';
import { ZodValidationPipe } from '../../../../infrastructure/pipes/zod-validation.pipe';
import { AuthGuard } from '../guards/auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

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
  async getMe(@CurrentUser() user: { id: string }): Promise<UserResponse> {
    return this.authService.getMe(user.id);
  }
}
