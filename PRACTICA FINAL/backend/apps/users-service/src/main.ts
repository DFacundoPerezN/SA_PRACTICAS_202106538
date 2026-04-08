import { NestFactory } from '@nestjs/core';
import { UsersServiceModule } from './users-service.module';

async function bootstrap() {
  const app = await NestFactory.create(UsersServiceModule);
  await app.listen(process.env.USERS_GRPC_PORT ?? 5002);
}
bootstrap();
