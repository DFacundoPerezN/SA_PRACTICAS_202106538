import { Inject, Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { USER_REPOSITORY } from '../interfaces/user-repository.interface';
import type { IUserRepository } from '../interfaces/user-repository.interface';
import { UserEntity } from '../../domain/user.entity';

export interface CreateUserInput {
  id:    string;
  name:  string;
  email: string;
  role:  string;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async execute(input: CreateUserInput): Promise<UserEntity> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new ConflictException(`Email ${input.email} is already registered`);
    }

    const role = await this.userRepo.findRoleByName(input.role || 'cliente');
    if (!role) {
      throw new BadRequestException(`Role '${input.role}' does not exist`);
    }

    return this.userRepo.create(input.id, input.name, input.email, role.id);
  }
}
