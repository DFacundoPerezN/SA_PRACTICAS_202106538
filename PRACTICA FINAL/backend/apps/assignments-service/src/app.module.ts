import { Module }        from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AssignmentEntity }        from './assignments/domain/assignment.entity';
import { AssignmentStatusEntity }  from './assignments/domain/assignment-status.entity';
import { TechnicianWorkloadEntity } from './assignments/domain/technician-workload.entity';

import { AssignmentsModule } from './assignments/assignments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type:        'mysql',
        host:        cfg.get<string>('ASSIGNMENTS_DB_HOST'),
        port:        cfg.get<number>('ASSIGNMENTS_DB_PORT'),
        username:    cfg.get<string>('ASSIGNMENTS_DB_USERNAME'),
        password:    cfg.get<string>('ASSIGNMENTS_DB_PASSWORD'),
        database:    cfg.get<string>('ASSIGNMENTS_DB_DATABASE'),
        synchronize: cfg.get<string>('ASSIGNMENTS_DB_SYNCHRONIZE') === 'true',
        logging:     cfg.get<string>('ASSIGNMENTS_DB_LOGGING')     === 'true',
        entities:    [
          AssignmentEntity,
          AssignmentStatusEntity,
          TechnicianWorkloadEntity,
        ],
        charset:  'utf8mb4',
        timezone: 'Z',
      }),
    }),

    AssignmentsModule,
  ],
})
export class AppModule {}
