import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AUTH_REPOSITORY } from '../interfaces/auth-repository.interface';
import type { IAuthRepository } from '../interfaces/auth-repository.interface';
import { HASH_SERVICE } from '../interfaces/token-service.interface';
import type { IHashService } from '../interfaces/token-service.interface';

export interface RegisterInput {
  email: string;
  password: string;
}

export interface RegisterOutput {
  userId: string;
  message: string;
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    @Inject(HASH_SERVICE)    private readonly hashSvc: IHashService,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const existing = await this.authRepo.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.hashSvc.hash(input.password);
    const userId = randomUUID();
    await this.authRepo.createUser(userId, input.email, passwordHash);

    return { userId, message: 'User registered successfully' };
  }
}
