import { Injectable } from '@nestjs/common';
import { CreateUserUseCase, CreateUserInput } from './use-cases/create-user.use-case';
import { FindUserUseCase }                    from './use-cases/find-user.use-case';
import { UpdateUserUseCase, UpdateUserInput } from './use-cases/update-user.use-case';
import { DeleteUserUseCase, DeleteUserOutput } from './use-cases/delete-user.use-case';
import { FindAllOptions }                      from './interfaces/user-repository.interface';
import { UserEntity }                          from '../domain/user.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly createUserUseCase:  CreateUserUseCase,
    private readonly findUserUseCase:    FindUserUseCase,
    private readonly updateUserUseCase:  UpdateUserUseCase,
    private readonly deleteUserUseCase:  DeleteUserUseCase,
  ) {}

  createUser(input: CreateUserInput): Promise<UserEntity> {
    return this.createUserUseCase.execute(input);
  }

  findById(id: string): Promise<UserEntity> {
    return this.findUserUseCase.findById(id);
  }

  findByEmail(email: string): Promise<UserEntity> {
    return this.findUserUseCase.findByEmail(email);
  }

  findAll(options: FindAllOptions): Promise<{ users: UserEntity[]; total: number }> {
    return this.findUserUseCase.findAll(options);
  }

  updateUser(input: UpdateUserInput): Promise<UserEntity> {
    return this.updateUserUseCase.execute(input);
  }

  deleteUser(id: string): Promise<DeleteUserOutput> {
    return this.deleteUserUseCase.execute(id);
  }
}
