import { Module }        from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

// Domain entities
import { NotificationEntity }     from './domain/notification.entity';
import { NotificationTypeEntity } from './domain/notification-type.entity';

// Controllers
import { NotificationsController }      from './notifications.controller';
import { RabbitMqConsumerController }   from './infrastructure/messaging/rabbitmq-consumer.controller';

// Application layer
import { NotificationsService }                from './application/notifications.service';
import { HandleTicketCreatedUseCase }          from './application/use-cases/handle-ticket-created.use-case';
import { HandleTicketAssignedUseCase }         from './application/use-cases/handle-ticket-assigned.use-case';
import { HandleTicketStatusUpdatedUseCase }    from './application/use-cases/handle-ticket-status-updated.use-case';
import { FindNotificationsUseCase }            from './application/use-cases/find-notifications.use-case';

// Infrastructure — repository
import { NotificationRepository }   from './infrastructure/repositories/notification.repository';
import { NOTIFICATION_REPOSITORY }  from './application/interfaces/notification-repository.interface';

// Infrastructure — gRPC client → users-service
import {
  UsersGrpcClientService,
  USERS_GRPC_CLIENT,
} from './infrastructure/messaging/users-grpc-client.service';
import { USERS_GRPC_CLIENT_TOKEN } from './application/interfaces/users-grpc-client.interface';

// Infrastructure — email sender (SendGrid)
import { SendgridEmailSenderService } from './infrastructure/messaging/sendgrid-email-sender.service';
import { EMAIL_SENDER }               from './application/interfaces/email-sender.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      NotificationTypeEntity,
    ]),

    // ── gRPC client → users-service (to resolve emails from userIds) ─────────
    ClientsModule.registerAsync([
      {
        name: USERS_GRPC_CLIENT,
        imports: [ConfigModule],
        inject:  [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package:   'users',
            protoPath: process.env.NODE_ENV === 'production'
              ? join(__dirname, '../../proto/users.proto')
              : join(process.cwd(), 'proto/users.proto'),
            url: cfg.get<string>('USERS_SERVICE_URL') ?? 'localhost:50052',
            keepalive: {
              keepaliveTimeMs:             10_000,
              keepaliveTimeoutMs:          5_000,
              keepalivePermitWithoutCalls: 1,
            },
          },
        }),
      },
    ]),
  ],

  controllers: [
    NotificationsController,       // gRPC methods (FindNotifications, FindByRecipient)
    RabbitMqConsumerController,    // RMQ event handlers
  ],

  providers: [
    // Application
    NotificationsService,
    HandleTicketCreatedUseCase,
    HandleTicketAssignedUseCase,
    HandleTicketStatusUpdatedUseCase,
    FindNotificationsUseCase,

    // Infrastructure — repository (concrete + DIP binding)
    NotificationRepository,
    { provide: NOTIFICATION_REPOSITORY, useExisting: NotificationRepository },

    // Infrastructure — gRPC client to users-service (concrete + DIP binding)
    UsersGrpcClientService,
    { provide: USERS_GRPC_CLIENT_TOKEN, useExisting: UsersGrpcClientService },

    // Infrastructure — email sender (concrete + DIP binding)
    SendgridEmailSenderService,
    { provide: EMAIL_SENDER, useExisting: SendgridEmailSenderService },
  ],
})
export class NotificationsModule {}
