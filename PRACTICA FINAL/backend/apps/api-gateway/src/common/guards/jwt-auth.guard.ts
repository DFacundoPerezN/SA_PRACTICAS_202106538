import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface ValidateTokenResponse {
  valid:  boolean;
  userId: string;
  role:   string;
}

interface AuthGrpcService {
  validate(data: { accessToken: string }): any;
}

@Injectable()
export class JwtAuthGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private authService!: AuthGrpcService;

  constructor(
    @Inject('AUTH_GRPC_CLIENT') private readonly client: ClientGrpc,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthGrpcService>('AuthService');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string = request.headers['authorization'] || '';

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    const token = authHeader.slice(7).trim();

    let result: ValidateTokenResponse;
    try {
      result = await firstValueFrom(
        this.authService.validate({ accessToken: token }),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Token validation failed: ${msg}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!result?.valid) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Attach user info (including role) to the request for use by RolesGuard
    request.user = { userId: result.userId, role: result.role };

    // ── Inline role check ────────────────────────────────────────────────────
    // Read the @Roles() metadata set on the handler or controller.
    // If no roles are required, any authenticated user is allowed.
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!requiredRoles.includes(result.role)) {
      this.logger.warn(
        `Access denied: user role '${result.role}' not in [${requiredRoles.join(', ')}]`,
      );
      throw new UnauthorizedException(
        `Access denied. Required role: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}
