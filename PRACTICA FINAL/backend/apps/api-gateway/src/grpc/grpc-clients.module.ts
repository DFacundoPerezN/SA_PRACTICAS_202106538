import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import {
  authGrpcOptions,
  usersGrpcOptions,
  ticketsGrpcOptions,
  assignmentsGrpcOptions,
} from './grpc.options';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_GRPC_CLIENT',
        ...authGrpcOptions(),
      },
      {
        name: 'USERS_GRPC_CLIENT',
        ...usersGrpcOptions(),
      },
      {
        name: 'TICKETS_GRPC_CLIENT',
        ...ticketsGrpcOptions(),
      },
      {
        name: 'ASSIGNMENTS_GRPC_CLIENT',
        ...assignmentsGrpcOptions(),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class GrpcClientsModule {}
