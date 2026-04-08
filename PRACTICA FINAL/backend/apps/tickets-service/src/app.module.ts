import { Module }         from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule }  from '@nestjs/typeorm';

import { TicketEntity }        from './tickets/domain/ticket.entity';
import { CommentEntity }       from './tickets/domain/comment.entity';
import { TicketHistoryEntity } from './tickets/domain/ticket-history.entity';
import { TicketStatusEntity }  from './tickets/domain/ticket-status.entity';
import { CategoryEntity }      from './tickets/domain/category.entity';
import { PriorityEntity }      from './tickets/domain/priority.entity';

import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type:        'mysql',
        host:        cfg.get<string>('TICKETS_DB_HOST'),
        port:        cfg.get<number>('TICKETS_DB_PORT'),
        username:    cfg.get<string>('TICKETS_DB_USERNAME'),
        password:    cfg.get<string>('TICKETS_DB_PASSWORD'),
        database:    cfg.get<string>('TICKETS_DB_DATABASE'),
        synchronize: cfg.get<string>('TICKETS_DB_SYNCHRONIZE') === 'true',
        logging:     cfg.get<string>('TICKETS_DB_LOGGING')     === 'true',
        entities:    [
          TicketEntity,
          CommentEntity,
          TicketHistoryEntity,
          TicketStatusEntity,
          CategoryEntity,
          PriorityEntity,
        ],
        charset:  'utf8mb4',
        timezone: 'Z',
        // mysql2 driver is resolved automatically by TypeORM when installed
      }),
    }),

    TicketsModule,
  ],
})
export class AppModule {}
