import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserAuthEntity }    from '../auth/domain/user-auth.entity';
import { RefreshTokenEntity } from '../auth/domain/refresh-token.entity';

export default registerAs('database', (): TypeOrmModuleOptions => ({
  type:        'mysql',
  host:        process.env.AUTH_DB_HOST     || 'localhost',
  port:        parseInt(process.env.AUTH_DB_PORT || '3306', 10),
  username:    process.env.AUTH_DB_USERNAME  || 'root',
  password:    process.env.AUTH_DB_PASSWORD  || '',
  database:    process.env.AUTH_DB_DATABASE  || 'auth_db',
  synchronize: process.env.AUTH_DB_SYNCHRONIZE === 'true',
  logging:     process.env.AUTH_DB_LOGGING   === 'true',
  entities:    [UserAuthEntity, RefreshTokenEntity],
  charset:     'utf8mb4',
  timezone:    'Z',
}));
