import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const grpcPort = process.env.TICKETS_GRPC_PORT || '50053';
  const host = '0.0.0.0';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package:   'tickets',
      protoPath: process.env.NODE_ENV === 'production'
        ? join(__dirname, '../../proto/tickets.proto')
        : join(process.cwd(), 'proto/tickets.proto'),
      url: `${host}:${grpcPort}`,
      keepalive: {
        keepaliveTimeMs:            10_000,
        keepaliveTimeoutMs:         5_000,
        keepalivePermitWithoutCalls: 1,
      },
    },
  });

  await app.listen();
  console.log(`Tickets Service running on ${host}:${grpcPort}`);
}

bootstrap();
