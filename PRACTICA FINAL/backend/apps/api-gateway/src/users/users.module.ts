import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { GrpcClientsModule } from '../grpc/grpc-clients.module';

@Module({
  imports: [GrpcClientsModule],
  controllers: [UsersController],
})
export class UsersModule {}
