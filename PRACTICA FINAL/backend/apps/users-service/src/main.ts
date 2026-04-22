import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const grpcPort = process.env.USERS_GRPC_PORT || '50052';
  const host     = '0.0.0.0';
  const rmqUrl   = process.env.RABBITMQ_URL   ?? 'amqp://guest:guest@rabbitmq:5672';
  const rmqQueue = process.env.RABBITMQ_QUEUE ?? 'ticket_assignments';

  // ── Primary transport: gRPC ───────────────────────────────────────────────
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'users',
      protoPath: process.env.NODE_ENV === 'production'
        ? join(__dirname, '../../proto/users.proto')
        : join(process.cwd(), 'proto/users.proto'),
      url: `${host}:${grpcPort}`,
      keepalive: {
        keepaliveTimeMs: 10000,
        keepaliveTimeoutMs: 5000,
        keepalivePermitWithoutCalls: 1,
      },
    },
  });

  // The RabbitMQ ClientProxy registered in UsersModule (USERS_RABBITMQ_CLIENT)
  // connects lazily on the first emit() call — no additional listen() needed here.

  await app.listen();
  console.log(`User Service (gRPC) running on ${host}:${grpcPort}`);
  console.log(`User Service (RMQ publisher) targeting queue="${rmqQueue}" at ${rmqUrl}`);
}

bootstrap();
