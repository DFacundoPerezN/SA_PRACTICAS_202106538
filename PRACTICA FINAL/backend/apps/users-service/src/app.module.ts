import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { UserEntity } from './users/domain/user.entity';
import { RoleEntity } from './users/domain/role.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'mysql',
        host: cfg.get<string>('USERS_DB_HOST'),
        port: cfg.get<number>('USERS_DB_PORT'),
        username: cfg.get<string>('USERS_DB_USERNAME'),
        password: cfg.get<string>('USERS_DB_PASSWORD'),
        database: cfg.get<string>('USERS_DB_DATABASE'),
        synchronize: cfg.get<string>('USERS_DB_SYNCHRONIZE') === 'true',
        logging: cfg.get<string>('USERS_DB_LOGGING') === 'true',
        entities: [UserEntity, RoleEntity],
        charset: 'utf8mb4_unicode_ci',
        timezone: 'Z',
        extra: {
          charset: 'UTF8MB4_UNICODE_CI',
        },
      }),
    }),

    UsersModule,
  ],
})
export class AppModule { }
