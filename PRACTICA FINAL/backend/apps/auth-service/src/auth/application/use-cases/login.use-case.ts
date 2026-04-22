import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AUTH_REPOSITORY } from '../interfaces/auth-repository.interface';
import type { IAuthRepository } from '../interfaces/auth-repository.interface';
import { HASH_SERVICE, TOKEN_SERVICE, TOKEN_HASH_SERVICE } from '../interfaces/token-service.interface';
import type { IHashService, ITokenService, ITokenHashService } from '../interfaces/token-service.interface';

export interface LoginInput {
  email:    string;
  password: string;
  role:     string;
}

export interface LoginOutput {
  accessToken:  string;
  refreshToken: string;
  userId:       string;
  role:         string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)    private readonly authRepo: IAuthRepository,
    @Inject(HASH_SERVICE)       private readonly hashSvc: IHashService,
    @Inject(TOKEN_SERVICE)      private readonly tokenSvc: ITokenService,
    @Inject(TOKEN_HASH_SERVICE) private readonly tokenHashSvc: ITokenHashService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.authRepo.findUserByEmail(input.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await this.hashSvc.compare(input.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload      = { sub: user.id, email: user.email, role: input.role };
    const accessToken  = this.tokenSvc.signAccessToken(payload);
    const refreshToken = this.tokenSvc.signRefreshToken(payload);

    const tokenHash = this.tokenHashSvc.hash(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.authRepo.saveRefreshToken(randomUUID(), user.id, tokenHash, expiresAt);

    return { accessToken, refreshToken, userId: user.id, role: input.role };
  }
}

