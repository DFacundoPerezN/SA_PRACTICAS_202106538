import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../interfaces/user-repository.interface';
import type { IUserRepository } from '../interfaces/user-repository.interface';

export interface DeleteUserOutput {
  success: boolean;
  message: string;
}

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async execute(id: string): Promise<DeleteUserOutput> {
    const user = await this.userRepo.findById(id);
    if (!user || user.deletedAt) {
      throw new NotFoundException(`User ${id} not found`);
    }

    await this.userRepo.softDelete(id);
    return { success: true, message: `User ${id} deleted successfully` };
  }
}
