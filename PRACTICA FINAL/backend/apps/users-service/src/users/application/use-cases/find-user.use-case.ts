import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, FindAllOptions } from '../interfaces/user-repository.interface';
import type { IUserRepository } from '../interfaces/user-repository.interface';
import { UserEntity } from '../../domain/user.entity';

@Injectable()
export class FindUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findById(id);
    if (!user || user.deletedAt) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const user = await this.userRepo.findByEmail(email);
    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async findAll(options: FindAllOptions): Promise<{ users: UserEntity[]; total: number }> {
    return this.userRepo.findAll(options);
  }
}
