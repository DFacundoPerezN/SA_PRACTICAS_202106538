import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AUTH_REPOSITORY } from '../interfaces/auth-repository.interface';
import type { IAuthRepository } from '../interfaces/auth-repository.interface';
import { HASH_SERVICE, TOKEN_SERVICE } from '../interfaces/token-service.interface';
import type { IHashService, ITokenService } from '../interfaces/token-service.interface';

export interface RefreshInput {
  refreshToken: string;
}

export interface RefreshOutput {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    @Inject(HASH_SERVICE)    private readonly hashSvc: IHashService,
    @Inject(TOKEN_SERVICE)   private readonly tokenSvc: ITokenService,
  ) {}

  async execute(input: RefreshInput): Promise<RefreshOutput> {
    const payload = this.tokenSvc.verifyRefreshToken(input.refreshToken);
    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash   = await this.hashSvc.hash(input.refreshToken);
    const storedToken = await this.authRepo.findRefreshToken(tokenHash);

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    await this.authRepo.revokeRefreshToken(tokenHash);

    const user = await this.authRepo.findUserById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const newPayload      = { sub: user.id, email: user.email };
    const newAccessToken  = this.tokenSvc.signAccessToken(newPayload);
    const newRefreshToken = this.tokenSvc.signRefreshToken(newPayload);

    const newTokenHash = await this.hashSvc.hash(newRefreshToken);
    const expiresAt    = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.authRepo.saveRefreshToken(randomUUID(), user.id, newTokenHash, expiresAt);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
