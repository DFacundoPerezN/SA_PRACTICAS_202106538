import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { USER_REPOSITORY } from '../interfaces/user-repository.interface';
import type { IUserRepository } from '../interfaces/user-repository.interface';
import { UserEntity } from '../../domain/user.entity';

export interface UpdateUserInput {
  id:    string;
  name?: string;
  email?: string;
  role?: string;
}

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async execute(input: UpdateUserInput): Promise<UserEntity> {
    const user = await this.userRepo.findById(input.id);
    if (!user || user.deletedAt) {
      throw new NotFoundException(`User ${input.id} not found`);
    }

    const data: Partial<Pick<UserEntity, 'name' | 'email' | 'roleId'>> = {};

    if (input.name)  data.name  = input.name;
    if (input.email) data.email = input.email;

    if (input.role) {
      const role = await this.userRepo.findRoleByName(input.role);
      if (!role) {
        throw new BadRequestException(`Role '${input.role}' does not exist`);
      }
      data.roleId = role.id;
    }

    return this.userRepo.update(input.id, data);
  }
}
