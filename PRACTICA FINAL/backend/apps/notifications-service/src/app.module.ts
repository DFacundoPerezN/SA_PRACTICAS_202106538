import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationEntity }     from './notifications/domain/notification.entity';
import { NotificationTypeEntity } from './notifications/domain/notification-type.entity';
import { NotificationsModule }    from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type:     'mysql',
        host:     cfg.get<string>('NOTIFICATIONS_DB_HOST'),
        port:     cfg.get<number>('NOTIFICATIONS_DB_PORT'),
        username: cfg.get<string>('NOTIFICATIONS_DB_USERNAME'),
        password: cfg.get<string>('NOTIFICATIONS_DB_PASSWORD'),
        database: cfg.get<string>('NOTIFICATIONS_DB_DATABASE'),
        synchronize: cfg.get<string>('NOTIFICATIONS_DB_SYNCHRONIZE') === 'true',
        logging:     cfg.get<string>('NOTIFICATIONS_DB_LOGGING')     === 'true',
        entities: [
          NotificationEntity,
          NotificationTypeEntity,
        ],
        charset:  'utf8mb4_unicode_ci',
        timezone: 'Z',
        extra: {
          charset: 'UTF8MB4_UNICODE_CI',
        },
      }),
    }),

    NotificationsModule,
  ],
})
export class AppModule {}
