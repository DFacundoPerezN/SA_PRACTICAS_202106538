import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  OnModuleInit,
  Logger,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  IsEmail, IsNotEmpty, IsString,
  IsInt, Min, Max,
} from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles }        from '../common/decorators/roles.decorator';

// ── DTOs ─────────────────────────────────────────────────────────────────────

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

/**
 * Admin registration accepts role as a numeric ID:
 *   1 = cliente  |  2 = tecnico  |  3 = administrador
 */
export class AdminRegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsInt()
  @Min(1)
  @Max(3)
  rol!: number;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}

export class LogoutDto {
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}

export class ValidateDto {
  @IsString()
  @IsNotEmpty()
  access_token!: string;
}

// ── Role ID → name map (mirrors the roles table in users_db) ─────────────────

const ROLE_ID_TO_NAME: Record<number, string> = {
  1: 'cliente',
  2: 'tecnico',
  3: 'administrador',
};

// ── gRPC service interfaces ───────────────────────────────────────────────────

interface AuthGrpcService {
  register(data: { email: string; password: string }): any;
  adminRegister(data: { email: string; password: string; roleId: number }): any;
  login(data: { email: string; password: string; role: string }): any;
  refresh(data: { refreshToken: string }): any;
  validate(data: { accessToken: string }): any;
  logout(data: { refreshToken: string }): any;
}

interface UsersGrpcService {
  createUser(data: { id: string; name: string; email: string; role: string }): any;
  findByEmail(data: { email: string }): any;
}

interface AuthRegisterResponse {
  userId?: string;
  user_id?: string;
  message?: string;
}

interface UserProfileResponse {
  role?: string;
}

// ── Controller ───────────────────────────────────────────────────────────────

@Controller('auth')
export class AuthController implements OnModuleInit {
  private readonly logger = new Logger(AuthController.name);
  private authService!: AuthGrpcService;
  private usersService!: UsersGrpcService;

  constructor(
    @Inject('AUTH_GRPC_CLIENT')  private readonly authClient: ClientGrpc,
    @Inject('USERS_GRPC_CLIENT') private readonly usersClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authService  = this.authClient.getService<AuthGrpcService>('AuthService');
    this.usersService = this.usersClient.getService<UsersGrpcService>('UsersService');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/auth/register  (public — role always 'cliente')
  //
  // Flow:
  //   1. Create credentials in auth-service → get userId
  //   2. Create profile in user-service with role 'cliente'
  // ──────────────────────────────────────────────────────────────────────────
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    this.logger.log(`register → ${dto.email}`);

    const authResult = await firstValueFrom<AuthRegisterResponse>(
      this.authService.register({ email: dto.email, password: dto.password }),
    );

    const userId = authResult.userId ?? authResult.user_id;
    if (!userId) {
      this.logger.error(`auth-service did not return userId for ${dto.email}`);
      throw new InternalServerErrorException(
        'Registration failed due to invalid auth response. Contact support.',
      );
    }

    try {
      await firstValueFrom(
        this.usersService.createUser({
          id:    userId,
          name:  dto.email.split('@')[0],
          email: dto.email,
          role:  'cliente',
        }),
      );
    } catch (err) {
      this.logger.error(
        `user-service profile creation failed for ${userId}: ${(err as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Registration succeeded but profile creation failed. Contact support.',
      );
    }

    return { user_id: userId, message: authResult.message };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/auth/admin/register  (protected — only 'administrador')
  //
  // Allows an admin to register a user with an explicit role:
  //   { email, password, rol: 1 | 2 | 3 }
  //
  // Flow:
  //   1. Create credentials in auth-service → get userId
  //   2. Create profile in user-service with the chosen role
  // ──────────────────────────────────────────────────────────────────────────
  @Post('admin/register')
  @UseGuards(JwtAuthGuard)
  @Roles('administrador')
  @HttpCode(HttpStatus.CREATED)
  async adminRegister(@Body() dto: AdminRegisterDto) {
    this.logger.log(`admin/register → ${dto.email} roleId=${dto.rol}`);

    const roleName = ROLE_ID_TO_NAME[dto.rol];

    // Step 1 — create credentials (auth-service validates duplicate email)
    const authResult = await firstValueFrom<AuthRegisterResponse>(
      this.authService.adminRegister({
        email:    dto.email,
        password: dto.password,
        roleId:   dto.rol,
      }),
    );

    const userId = authResult.userId ?? authResult.user_id;
    if (!userId) {
      this.logger.error(`auth-service did not return userId for ${dto.email}`);
      throw new InternalServerErrorException(
        'Registration failed due to invalid auth response. Contact support.',
      );
    }

    // Step 2 — create profile with the chosen role
    try {
      await firstValueFrom(
        this.usersService.createUser({
          id:    userId,
          name:  dto.email.split('@')[0],
          email: dto.email,
          role:  roleName,
        }),
      );
    } catch (err) {
      this.logger.error(
        `user-service profile creation failed for ${userId}: ${(err as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Registration succeeded but profile creation failed. Contact support.',
      );
    }

    return { user_id: userId, role: roleName, message: authResult.message };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/auth/login
  //
  // Flow:
  //   1. Fetch role from user-service (source of truth)
  //   2. Pass role to auth-service → embedded in JWT
  //      JWT payload: { sub, email, role, iat, exp }
  // ──────────────────────────────────────────────────────────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    this.logger.log(`login → ${dto.email}`);

    let role = 'cliente';
    try {
      const profile = await firstValueFrom<UserProfileResponse>(
        this.usersService.findByEmail({ email: dto.email }),
      );
      role = profile?.role ?? 'cliente';
    } catch (err) {
      this.logger.warn(
        `user-service lookup failed for ${dto.email}: ${(err as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Unable to verify user profile. Try again later.',
      );
    }

    // auth-service returns: { accessToken, refreshToken, userId, role }
    return firstValueFrom(
      this.authService.login({ email: dto.email, password: dto.password, role }),
    );
  }

  /** POST /api/auth/refresh */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    this.logger.log('refresh token');
    return firstValueFrom(
      this.authService.refresh({ refreshToken: dto.refresh_token }),
    );
  }

  /** POST /api/auth/validate */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validate(@Body() dto: ValidateDto) {
    this.logger.log('validate token');
    return firstValueFrom(
      this.authService.validate({ accessToken: dto.access_token }),
    );
  }

  /** POST /api/auth/logout */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto) {
    this.logger.log('logout');
    return firstValueFrom(
      this.authService.logout({ refreshToken: dto.refresh_token }),
    );
  }
}
