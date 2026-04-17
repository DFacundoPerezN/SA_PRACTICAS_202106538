import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

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

import {
  UsersRabbitMqPublisherService,
  USERS_RABBITMQ_CLIENT,
} from './infrastructure/messaging/rabbitmq-publisher.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RoleEntity]),

    // ── RabbitMQ publish client ─────────────────────────────────────────────
    ClientsModule.registerAsync([
      {
        name: USERS_RABBITMQ_CLIENT,
        imports: [ConfigModule],
        inject:  [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls:         [cfg.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672'],
            queue:        cfg.get<string>('RABBITMQ_QUEUE') ?? 'ticket_assignments',
            exchangeName: cfg.get<string>('RABBITMQ_EXCHANGE') ?? 'tickets_exchange',
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
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

    // RabbitMQ publisher
    UsersRabbitMqPublisherService,
  ],
})
export class UsersModule {}
