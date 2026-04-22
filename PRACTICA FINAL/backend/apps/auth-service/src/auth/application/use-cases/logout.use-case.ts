import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_REPOSITORY } from '../interfaces/auth-repository.interface';
import type { IAuthRepository } from '../interfaces/auth-repository.interface';
import { TOKEN_SERVICE, TOKEN_HASH_SERVICE } from '../interfaces/token-service.interface';
import type { ITokenService, ITokenHashService } from '../interfaces/token-service.interface';

export interface LogoutInput {
  refreshToken: string;
}

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)    private readonly authRepo: IAuthRepository,
    @Inject(TOKEN_SERVICE)      private readonly tokenSvc: ITokenService,
    @Inject(TOKEN_HASH_SERVICE) private readonly tokenHashSvc: ITokenHashService,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    const payload = this.tokenSvc.verifyRefreshToken(input.refreshToken);
    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.tokenHashSvc.hash(input.refreshToken);
    await this.authRepo.revokeRefreshToken(tokenHash);
  }
}
