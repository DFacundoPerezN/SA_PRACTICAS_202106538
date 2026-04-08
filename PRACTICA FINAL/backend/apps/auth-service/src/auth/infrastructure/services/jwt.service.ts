import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ITokenService, TokenPayload } from '../../application/interfaces/token-service.interface';

@Injectable()
export class JwtTokenService implements ITokenService {
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: JwtSignOptions['expiresIn'];

  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {
    this.refreshSecret    = (this.configService.get<string>('JWT_SECRET') || 'secret') + '_refresh';
    this.accessExpiresIn  = (this.configService.get<string>('JWT_EXPIRES_IN') || '24h') as JwtSignOptions['expiresIn'];
  }

  signAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, { expiresIn: this.accessExpiresIn });
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return this.jwtService.verify<TokenPayload>(token);
    } catch {
      return null;
    }
  }

  signRefreshToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      secret:    this.refreshSecret,
      expiresIn: '7d',
    });
  }

  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      return this.jwtService.verify<TokenPayload>(token, { secret: this.refreshSecret });
    } catch {
      return null;
    }
  }
}
