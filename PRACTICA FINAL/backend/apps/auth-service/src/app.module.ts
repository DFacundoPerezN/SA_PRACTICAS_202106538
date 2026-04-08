import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserAuthEntity }    from './auth/domain/user-auth.entity';
import { RefreshTokenEntity } from './auth/domain/refresh-token.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type:        'mysql',
        host:        cfg.get<string>('AUTH_DB_HOST'),
        port:        cfg.get<number>('AUTH_DB_PORT'),
        username:    cfg.get<string>('AUTH_DB_USERNAME'),
        password:    cfg.get<string>('AUTH_DB_PASSWORD'),
        database:    cfg.get<string>('AUTH_DB_DATABASE'),
        synchronize: cfg.get<string>('AUTH_DB_SYNCHRONIZE') === 'true',
        logging:     cfg.get<string>('AUTH_DB_LOGGING') === 'true',
        entities:    [UserAuthEntity, RefreshTokenEntity],
        charset:     'utf8mb4',
        timezone:    'Z',
      }),
    }),

    AuthModule,
  ],
})
export class AppModule {}
