import { Module }         from '@nestjs/common';
import { TypeOrmModule }  from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Domain entities
import { TicketEntity }        from './domain/ticket.entity';
import { CommentEntity }       from './domain/comment.entity';
import { TicketHistoryEntity } from './domain/ticket-history.entity';
import { TicketStatusEntity }  from './domain/ticket-status.entity';
import { CategoryEntity }      from './domain/category.entity';
import { PriorityEntity }      from './domain/priority.entity';

// Controller
import { TicketsController } from './tickets.controller';

// Application layer
import { TicketsService }           from './application/tickets.service';
import { CreateTicketUseCase }      from './application/use-cases/create-ticket.use-case';
import { FindTicketUseCase }        from './application/use-cases/find-ticket.use-case';
import { UpdateTicketUseCase }      from './application/use-cases/update-ticket.use-case';
import { ChangeStatusUseCase }      from './application/use-cases/change-status.use-case';
import { AssignTicketUseCase }      from './application/use-cases/assign-ticket.use-case';
import { AddCommentUseCase }        from './application/use-cases/add-comment.use-case';
import { AutoCloseTicketsUseCase }  from './application/use-cases/auto-close-tickets.use-case';

// Infrastructure — repository
import { TicketRepository }   from './infrastructure/repositories/ticket.repository';
import { TICKET_REPOSITORY }  from './application/interfaces/ticket-repository.interface';

// Infrastructure — messaging
import { RabbitMqPublisherService, RABBITMQ_CLIENT } from './infrastructure/messaging/rabbitmq-publisher.service';
import { EVENT_PUBLISHER }                           from './application/interfaces/event-publisher.interface';

// Infrastructure — scheduler
import { AutoCloseScheduler } from './infrastructure/scheduler/auto-close.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TicketEntity,
      CommentEntity,
      TicketHistoryEntity,
      TicketStatusEntity,
      CategoryEntity,
      PriorityEntity,
    ]),

    // RabbitMQ client (publish only — this service never consumes)
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_CLIENT,
        imports: [ConfigModule],
        inject:  [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls:         [cfg.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672'],
            queue:        'ticket_assignments',   // must match RABBITMQ_QUEUE of assignments-service
            queueOptions: { durable: true },
            // noAck and prefetchCount are consumer options — omit them here
            // because tickets-service is a publisher only and never consumes.
            // Having noAck:false on a publish-only client causes RabbitMQ to
            // open a reply-consumer channel that conflicts with the real consumer
            // (assignments-service) and throws 406 PRECONDITION_FAILED.
          },
        }),
      },
    ]),

    ScheduleModule.forRoot(),
  ],

  controllers: [TicketsController],

  providers: [
    // Application
    TicketsService,
    CreateTicketUseCase,
    FindTicketUseCase,
    UpdateTicketUseCase,
    ChangeStatusUseCase,
    AssignTicketUseCase,
    AddCommentUseCase,
    AutoCloseTicketsUseCase,

    // Infrastructure — repository (concrete + DIP binding)
    TicketRepository,
    { provide: TICKET_REPOSITORY, useExisting: TicketRepository },

    // Infrastructure — messaging (concrete + DIP binding)
    RabbitMqPublisherService,
    { provide: EVENT_PUBLISHER, useExisting: RabbitMqPublisherService },

    // Infrastructure — scheduler
    AutoCloseScheduler,
  ],
})
export class TicketsModule {}
