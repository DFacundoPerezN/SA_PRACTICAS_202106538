import { NestFactory }     from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join }            from 'path';
import { AppModule }       from './app.module';

async function bootstrap() {
  const grpcPort    = process.env.NOTIFICATION_GRPC_PORT ?? '50055';
  const host        = '0.0.0.0';
  const rmqUrl      = process.env.RABBITMQ_URL      ?? 'amqp://guest:guest@rabbitmq:5672';
  const rmqQueue    = process.env.RABBITMQ_QUEUE    ?? 'ticket_assignments';
  const rmqExchange = process.env.RABBITMQ_EXCHANGE ?? 'tickets_exchange';

  // ── Primary transport: gRPC ─────────────────────────────────────────────
  const grpcApp = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package:   'notifications',
      protoPath: process.env.NODE_ENV === 'production'
        ? join(__dirname, '../../proto/notifications.proto')
        : join(process.cwd(), 'proto/notifications.proto'),
      url: `${host}:${grpcPort}`,
      keepalive: {
        keepaliveTimeMs:             10_000,
        keepaliveTimeoutMs:          5_000,
        keepalivePermitWithoutCalls: 1,
      },
    },
  });

  // ── Secondary transport: RabbitMQ (consumes ticket events) ──────────────
  // notifications-service uses its OWN queue (ticket_assignments_notifications)
  // bound to the same topic exchange. This way it receives every event
  // independently from assignments-service — no message is stolen between queues.
  // routingKey '#' matches all routing keys published to the exchange.
  const rmqApp = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls:         [rmqUrl],
      queue:        `${rmqQueue}_notifications`,
      exchangeName: rmqExchange,
      exchangeType: 'topic',
      routingKey:   '#',
      queueOptions: { durable: true },
      noAck:        true,
    },
  });

  await Promise.all([grpcApp.listen(), rmqApp.listen()]);
  console.log(`Notifications Service (gRPC) running on ${host}:${grpcPort}`);
  console.log(`Notifications Service (RMQ)  consuming queue="${rmqQueue}_notifications" exchange="${rmqExchange}" [topic]`);
}

bootstrap();
