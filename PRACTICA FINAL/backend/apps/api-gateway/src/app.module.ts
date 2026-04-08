import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { GrpcClientsModule }   from './grpc/grpc-clients.module';
import { AuthModule }          from './auth/auth.module';
import { UsersModule }         from './users/users.module';
import { TicketsModule }       from './tickets/tickets.module';
import { AssignmentsModule }   from './assignments/assignments.module';
import { LoggingInterceptor }  from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GrpcClientsModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    AssignmentsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
