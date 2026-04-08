import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import type { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UserAuthEntity }     from './domain/user-auth.entity';
import { RefreshTokenEntity } from './domain/refresh-token.entity';

import { AuthController } from './auth.controller';
import { AuthService }    from './application/auth.service';

import { RegisterUseCase }       from './application/use-cases/register.use-case';
import { AdminRegisterUseCase }  from './application/use-cases/admin-register.use-case';
import { LoginUseCase }          from './application/use-cases/login.use-case';
import { RefreshTokenUseCase }   from './application/use-cases/refresh-token.use-case';
import { ValidateTokenUseCase }  from './application/use-cases/validate-token.use-case';
import { LogoutUseCase }         from './application/use-cases/logout.use-case';

import { AuthRepository }   from './infrastructure/repositories/auth.repository';
import { BcryptService }    from './infrastructure/services/bcrypt.service';
import { JwtTokenService }  from './infrastructure/services/jwt.service';
import { TokenHashService } from './infrastructure/services/token-hash.service';

import { AUTH_REPOSITORY }                                      from './application/interfaces/auth-repository.interface';
import { TOKEN_SERVICE, HASH_SERVICE, TOKEN_HASH_SERVICE }      from './application/interfaces/token-service.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAuthEntity, RefreshTokenEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret:      cfg.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (cfg.get<string>('JWT_EXPIRES_IN') || '24h') as NonNullable<JwtModuleOptions['signOptions']>['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RegisterUseCase,
    AdminRegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    ValidateTokenUseCase,
    LogoutUseCase,

    AuthRepository,
    BcryptService,
    JwtTokenService,
    TokenHashService,

    { provide: AUTH_REPOSITORY,    useExisting: AuthRepository   },
    { provide: TOKEN_SERVICE,      useExisting: JwtTokenService  },
    { provide: HASH_SERVICE,       useExisting: BcryptService    },
    { provide: TOKEN_HASH_SERVICE, useExisting: TokenHashService },
  ],
})
export class AuthModule {}
