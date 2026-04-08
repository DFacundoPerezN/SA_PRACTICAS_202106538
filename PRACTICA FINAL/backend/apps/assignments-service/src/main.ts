import { NestFactory }     from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join }            from 'path';
import { AppModule }       from './app.module';

async function bootstrap() {
  const grpcPort    = process.env.ASSIGNMENTS_GRPC_PORT ?? '50054';
  const host        = '0.0.0.0';
  const rmqUrl      = process.env.RABBITMQ_URL      ?? 'amqp://guest:guest@rabbitmq:5672';
  const rmqQueue    = process.env.RABBITMQ_QUEUE    ?? 'ticket_assignments';
  const rmqExchange = process.env.RABBITMQ_EXCHANGE ?? 'tickets_exchange';

  // ── Primary transport: gRPC ───────────────────────────────────────────────
  const grpcApp = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package:   'assignments',
      protoPath: process.env.NODE_ENV === 'production'
        ? join(__dirname, '../../proto/assignments.proto')
        : join(process.cwd(), 'proto/assignments.proto'),
      url: `${host}:${grpcPort}`,
      keepalive: {
        keepaliveTimeMs:             10_000,
        keepaliveTimeoutMs:          5_000,
        keepalivePermitWithoutCalls: 1,
      },
    },
  });

  // ── Secondary transport: RabbitMQ (consumes ticket.created) ──────────────
  // Uses the same queue tickets-service publishes to (RABBITMQ_QUEUE).
  // Both services must reference the same queue name so messages route correctly.
  const rmqApp = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls:         [rmqUrl],
      queue:        rmqQueue,
      exchangeName: rmqExchange,
      queueOptions: { durable: true },
      noAck:        false,
      prefetchCount: 1,
    },
  });

  await Promise.all([grpcApp.listen(), rmqApp.listen()]);
  console.log(`Assignments Service (gRPC) running on ${host}:${grpcPort}`);
  console.log(`Assignments Service (RMQ)  consuming queue="${rmqQueue}" exchange="${rmqExchange}"`);
}

bootstrap();
