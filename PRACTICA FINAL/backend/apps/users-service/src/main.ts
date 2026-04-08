import { NestFactory } from '@nestjs/core';
<<<<<<< HEAD
import { UsersServiceModule } from './users-service.module';

async function bootstrap() {
  const app = await NestFactory.create(UsersServiceModule);
  await app.listen(process.env.USERS_GRPC_PORT ?? 5002);
}
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
bootstrap();
