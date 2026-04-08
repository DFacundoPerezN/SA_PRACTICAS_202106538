import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './application/auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod('AuthService', 'Register')
  async register(data: { email: string; password: string }) {
    const result = await this.authService.register(data);
    return {
      user_id: result.userId,
      message: result.message,
    };
  }

  @GrpcMethod('AuthService', 'Login')
  async login(data: { email: string; password: string }) {
    const result = await this.authService.login(data);
    return {
      access_token:  result.accessToken,
      refresh_token: result.refreshToken,
      user_id:       result.userId,
    };
  }

  @GrpcMethod('AuthService', 'Refresh')
  async refresh(data: { refresh_token: string }) {
    const result = await this.authService.refresh({ refreshToken: data.refresh_token });
    return {
      access_token:  result.accessToken,
      refresh_token: result.refreshToken,
    };
  }

  @GrpcMethod('AuthService', 'Validate')
  validate(data: { access_token: string }) {
    const result = this.authService.validate({ accessToken: data.access_token });
    return {
      valid:   result.valid,
      user_id: result.userId,
    };
  }

  @GrpcMethod('AuthService', 'Logout')
  async logout(data: { refresh_token: string }) {
    await this.authService.refresh({ refreshToken: data.refresh_token }).catch(() => null);
    return { success: true };
  }
}
