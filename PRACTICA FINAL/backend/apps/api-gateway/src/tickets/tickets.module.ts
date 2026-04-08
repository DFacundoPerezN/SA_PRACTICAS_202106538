import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { GrpcClientsModule } from '../grpc/grpc-clients.module';

@Module({
  imports: [GrpcClientsModule],
  controllers: [TicketsController],
})
export class TicketsModule {}
