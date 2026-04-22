import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { GrpcClientsModule } from '../grpc/grpc-clients.module';

@Module({
  imports: [GrpcClientsModule],
  controllers: [AuthController],
})
export class AuthModule {}
