import { Inject, Injectable } from '@nestjs/common';
import type { ITokenService } from '../interfaces/token-service.interface';
import { TOKEN_SERVICE } from '../interfaces/token-service.interface';

export interface ValidateInput {
  accessToken: string;
}

export interface ValidateOutput {
  valid: boolean;
  userId: string;
}

@Injectable()
export class ValidateTokenUseCase {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenSvc: ITokenService,
  ) {}

  execute(input: ValidateInput): ValidateOutput {
    const payload = this.tokenSvc.verifyAccessToken(input.accessToken);
    if (!payload) {
      return { valid: false, userId: '' };
    }
    return { valid: true, userId: payload.sub };
  }
}
