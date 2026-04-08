import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from './domain/user.entity';
import { RoleEntity } from './domain/role.entity';

import { UsersController } from './users.controller';
import { UsersService }    from './application/users.service';

import { CreateUserUseCase }  from './application/use-cases/create-user.use-case';
import { FindUserUseCase }    from './application/use-cases/find-user.use-case';
import { UpdateUserUseCase }  from './application/use-cases/update-user.use-case';
import { DeleteUserUseCase }  from './application/use-cases/delete-user.use-case';

import { UserRepository }   from './infrastructure/repositories/user.repository';
import { USER_REPOSITORY }  from './application/interfaces/user-repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RoleEntity]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    CreateUserUseCase,
    FindUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,

    UserRepository,
    { provide: USER_REPOSITORY, useExisting: UserRepository },
  ],
})
export class UsersModule {}
