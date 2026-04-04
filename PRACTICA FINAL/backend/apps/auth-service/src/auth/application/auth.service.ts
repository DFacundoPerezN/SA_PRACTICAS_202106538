import { Injectable } from '@nestjs/common';
import { RegisterUseCase, RegisterInput, RegisterOutput } from './use-cases/register.use-case';
import { LoginUseCase, LoginInput, LoginOutput }          from './use-cases/login.use-case';
import { RefreshTokenUseCase, RefreshInput, RefreshOutput } from './use-cases/refresh-token.use-case';
import { ValidateTokenUseCase, ValidateInput, ValidateOutput } from './use-cases/validate-token.use-case';

@Injectable()
export class AuthService {
  constructor(
    private readonly registerUseCase:      RegisterUseCase,
    private readonly loginUseCase:         LoginUseCase,
    private readonly refreshTokenUseCase:  RefreshTokenUseCase,
    private readonly validateTokenUseCase: ValidateTokenUseCase,
  ) {}

  register(input: RegisterInput): Promise<RegisterOutput> {
    return this.registerUseCase.execute(input);
  }

  login(input: LoginInput): Promise<LoginOutput> {
    return this.loginUseCase.execute(input);
  }

  refresh(input: RefreshInput): Promise<RefreshOutput> {
    return this.refreshTokenUseCase.execute(input);
  }

  validate(input: ValidateInput): ValidateOutput {
    return this.validateTokenUseCase.execute(input);
  }
}
