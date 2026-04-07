import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from '../users/domain/user.entity';
import { RoleEntity } from '../users/domain/role.entity';

export default registerAs('database', (): TypeOrmModuleOptions => ({
  type:        'mysql',
  host:        process.env.USERS_DB_HOST     || 'localhost',
  port:        parseInt(process.env.USERS_DB_PORT || '3306', 10),
  username:    process.env.USERS_DB_USERNAME  || 'root',
  password:    process.env.USERS_DB_PASSWORD  || '',
  database:    process.env.USERS_DB_DATABASE  || 'users_db',
  synchronize: process.env.USERS_DB_SYNCHRONIZE === 'true',
  logging:     process.env.USERS_DB_LOGGING   === 'true',
  entities:    [UserEntity, RoleEntity],
  charset:     'utf8mb4',
  timezone:    'Z',
}));
