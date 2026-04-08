import { NestFactory } from '@nestjs/core';
import { AssignmentsServiceModule } from './assignments-service.module';

async function bootstrap() {
  const app = await NestFactory.create(AssignmentsServiceModule);
  await app.listen(process.env.ASSIGNMENTS_GRPC_PORT ?? 5004);
}
bootstrap();
