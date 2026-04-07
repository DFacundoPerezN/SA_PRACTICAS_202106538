import { NestFactory } from '@nestjs/core';
import { NotificationsServiceModule } from './notifications-service.module';

async function bootstrap() {
  const app = await NestFactory.create(NotificationsServiceModule);
  await app.listen(process.env.NOTIFICATION_GRPC_PORT ?? 5005);
}
bootstrap();
