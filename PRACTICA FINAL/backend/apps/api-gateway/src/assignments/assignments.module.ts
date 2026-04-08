import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { GrpcClientsModule }     from '../grpc/grpc-clients.module';

@Module({
  imports: [GrpcClientsModule],
  controllers: [AssignmentsController],
})
export class AssignmentsModule {}
