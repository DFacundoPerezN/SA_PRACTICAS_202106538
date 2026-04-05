import { NestFactory } from '@nestjs/core';
import { TicketsServiceModule } from './tickets-service.module';

async function bootstrap() {
  const app = await NestFactory.create(TicketsServiceModule);
  await app.listen(process.env.TICKETS_GRPC_PORT ?? 5003);
}
bootstrap();
