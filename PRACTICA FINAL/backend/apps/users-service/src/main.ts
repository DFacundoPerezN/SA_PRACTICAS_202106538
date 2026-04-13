import { NestFactory } from '@nestjs/core';
<<<<<<< HEAD:PRACTICA FINAL/backend/apps/users-service/src/main.ts
<<<<<<< HEAD
=======
>>>>>>> origin/feature/201908327:backend/apps/users-service/src/main.ts
import { UsersServiceModule } from './users-service.module';

async function bootstrap() {
  const app = await NestFactory.create(UsersServiceModule);
  await app.listen(process.env.USERS_GRPC_PORT ?? 5002);
}
<<<<<<< HEAD:PRACTICA FINAL/backend/apps/users-service/src/main.ts
=======
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const grpcPort = process.env.USERS_GRPC_PORT || '50052';
  const host = '0.0.0.0';

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

  await app.listen();
  console.log(`User Service running on ${host}:${grpcPort}`);
}

>>>>>>> feature/202106538
=======
>>>>>>> origin/feature/201908327:backend/apps/users-service/src/main.ts
bootstrap();
