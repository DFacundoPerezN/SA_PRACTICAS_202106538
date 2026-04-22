import { Inject, Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AUTH_REPOSITORY } from '../interfaces/auth-repository.interface';
import type { IAuthRepository } from '../interfaces/auth-repository.interface';
import { HASH_SERVICE } from '../interfaces/token-service.interface';
import type { IHashService } from '../interfaces/token-service.interface';

export interface AdminRegisterInput {
  email:    string;
  password: string;
  roleId:   number;
}

export interface AdminRegisterOutput {
  userId:  string;
  message: string;
}

const VALID_ROLE_IDS = [1, 2, 3];

@Injectable()
export class AdminRegisterUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: IAuthRepository,
    @Inject(HASH_SERVICE)    private readonly hashSvc: IHashService,
  ) {}

  async execute(input: AdminRegisterInput): Promise<AdminRegisterOutput> {
    if (!VALID_ROLE_IDS.includes(input.roleId)) {
      throw new BadRequestException(
        `Invalid role_id ${input.roleId}. Accepted values: 1 (cliente), 2 (tecnico), 3 (administrador)`,
      );
    }

    const existing = await this.authRepo.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictException(`Email ${input.email} is already registered`);
    }

    const passwordHash = await this.hashSvc.hash(input.password);
    const userId       = randomUUID();
    await this.authRepo.createUser(userId, input.email, passwordHash);

    return { userId, message: 'User registered successfully' };
  }
}
