import { Module }        from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

// Domain entities
import { AssignmentEntity }        from './domain/assignment.entity';
import { AssignmentStatusEntity }  from './domain/assignment-status.entity';
import { TechnicianWorkloadEntity } from './domain/technician-workload.entity';

// gRPC controller (handles incoming gRPC calls)
import { AssignmentsController } from './assignments.controller';

// Application layer
import { AssignmentsService }       from './application/assignments.service';
import { ManualAssignUseCase }      from './application/use-cases/manual-assign.use-case';
import { AutoAssignUseCase }        from './application/use-cases/auto-assign.use-case';
import { UpdateAssignmentUseCase }  from './application/use-cases/update-assignment.use-case';
import { FindAssignmentUseCase }    from './application/use-cases/find-assignment.use-case';

// Infrastructure — repository
import { AssignmentRepository }   from './infrastructure/repositories/assignment.repository';
import { ASSIGNMENT_REPOSITORY }  from './application/interfaces/assignment-repository.interface';

// Infrastructure — messaging (RabbitMQ publisher)
import {
  RabbitMqPublisherService,
  ASSIGNMENTS_RABBITMQ_CLIENT,
} from './infrastructure/messaging/rabbitmq-publisher.service';
import { ASSIGNMENT_EVENT_PUBLISHER } from './application/interfaces/event-publisher.interface';

// Infrastructure — messaging (RabbitMQ consumer controller)
import { RabbitMqConsumerController } from './infrastructure/messaging/rabbitmq-consumer.controller';

// Infrastructure — gRPC client to tickets-service
import {
  TicketsGrpcClientService,
  TICKETS_GRPC_CLIENT,
} from './infrastructure/messaging/tickets-grpc-client.service';
import { TICKETS_GRPC_CLIENT_TOKEN } from './application/interfaces/tickets-grpc-client.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssignmentEntity,
      AssignmentStatusEntity,
      TechnicianWorkloadEntity,
    ]),

    // ── RabbitMQ publish client ─────────────────────────────────────────────
    ClientsModule.registerAsync([
      {
        name: ASSIGNMENTS_RABBITMQ_CLIENT,
        imports: [ConfigModule],
        inject:  [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls:         [cfg.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672'],
            queue:        cfg.get<string>('RABBITMQ_QUEUE') ?? 'ticket_assignments',
            exchangeName: cfg.get<string>('RABBITMQ_EXCHANGE') ?? 'tickets_exchange',
            queueOptions: { durable: true },
            // noAck and prefetchCount are consumer options — omit from publisher client
          },
        }),
      },

      // ── gRPC client → tickets-service (for AssignTicket call) ──────────────
      {
        name: TICKETS_GRPC_CLIENT,
        imports: [ConfigModule],
        inject:  [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package:   'tickets',
            protoPath: process.env.NODE_ENV === 'production'
              ? join(__dirname, '../../proto/tickets.proto')
              : join(process.cwd(), 'proto/tickets.proto'),
            url: cfg.get<string>('TICKETS_SERVICE_URL') ?? 'localhost:50053',
            keepalive: {
              keepaliveTimeMs:            10_000,
              keepaliveTimeoutMs:         5_000,
              keepalivePermitWithoutCalls: 1,
            },
          },
        }),
      },
    ]),
  ],

  controllers: [
    AssignmentsController,        // gRPC methods
    RabbitMqConsumerController,   // RMQ event handler (ticket.created)
  ],

  providers: [
    // Application
    AssignmentsService,
    ManualAssignUseCase,
    AutoAssignUseCase,
    UpdateAssignmentUseCase,
    FindAssignmentUseCase,

    // Infrastructure — repository (concrete + DIP binding)
    AssignmentRepository,
    { provide: ASSIGNMENT_REPOSITORY, useExisting: AssignmentRepository },

    // Infrastructure — RabbitMQ publisher (concrete + DIP binding)
    RabbitMqPublisherService,
    { provide: ASSIGNMENT_EVENT_PUBLISHER, useExisting: RabbitMqPublisherService },

    // Infrastructure — tickets gRPC client (concrete + DIP binding)
    TicketsGrpcClientService,
    { provide: TICKETS_GRPC_CLIENT_TOKEN, useExisting: TicketsGrpcClientService },
  ],
})
export class AssignmentsModule {}
