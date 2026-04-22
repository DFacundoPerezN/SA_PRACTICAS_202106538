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
      userId:  result.userId,
      message: result.message,
    };
  }

  @GrpcMethod('AuthService', 'AdminRegister')
  async adminRegister(data: { email: string; password: string; roleId: number }) {
    const result = await this.authService.adminRegister({
      email:    data.email,
      password: data.password,
      roleId:   data.roleId,
    });
    return {
      userId:  result.userId,
      message: result.message,
    };
  }

  @GrpcMethod('AuthService', 'Login')
  async login(data: { email: string; password: string; role: string }) {
    const result = await this.authService.login({
      email:    data.email,
      password: data.password,
      role:     data.role,
    });
    return {
      accessToken:  result.accessToken,
      refreshToken: result.refreshToken,
      userId:       result.userId,
      role:         result.role,
    };
  }

  @GrpcMethod('AuthService', 'Refresh')
  async refresh(data: { refreshToken: string }) {
    const result = await this.authService.refresh({ refreshToken: data.refreshToken });
    return {
      accessToken:  result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @GrpcMethod('AuthService', 'Validate')
  validate(data: { accessToken: string }) {
    const result = this.authService.validate({ accessToken: data.accessToken });
    return {
      valid:  result.valid,
      userId: result.userId,
      role:   result.role,
    };
  }

  @GrpcMethod('AuthService', 'Logout')
  async logout(data: { refreshToken: string }) {
    try {
      await this.authService.logout({ refreshToken: data.refreshToken });
    } catch {
      // swallow — logout always succeeds from the client's perspective
    }
    return { success: true };
  }
}
