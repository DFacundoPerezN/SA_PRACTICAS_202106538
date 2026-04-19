import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const grpcPort    = process.env.NOTIFICATIONS_GRPC_PORT ?? '50055';
  const host        = '0.0.0.0';
  const rmqUrl      = process.env.RABBITMQ_URL      ?? 'amqp://guest:guest@rabbitmq:5672';
  const rmqExchange = process.env.RABBITMQ_EXCHANGE ?? 'tickets_exchange';

  // Cola exclusiva — separada de 'ticket_assignments' que usa assignments-service.
  const notificationsQueue = 'ticket_notifications';

  // ── Primary transport: gRPC ──────────────────────────────────────────────
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

  // ── Secondary transport: RabbitMQ ────────────────────────────────────────
  // wildcards: true es CRÍTICO — le dice a NestJS que:
  //   1. Use channel.publish(exchange, pattern) en vez de sendToQueue (lado publisher)
  //   2. Bindee automáticamente cada @EventPattern como routing key al exchange (lado server)
  //      → ticket.created, ticket.assigned, ticket.status.updated se bindean solos
  const rmqApp = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls:         [rmqUrl],
      queue:        notificationsQueue,
      exchange:     rmqExchange,
      exchangeType: 'topic',
      wildcards:    true,
      queueOptions: { durable: true },
      noAck:        true,
    },
  });

  await Promise.all([grpcApp.listen(), rmqApp.listen()]);
  console.log(`Notifications Service (gRPC) running on ${host}:${grpcPort}`);
  console.log(`Notifications Service (RMQ)  consuming queue="${notificationsQueue}" exchange="${rmqExchange}" wildcards=true`);
}

bootstrap();
