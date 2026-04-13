import { NestFactory } from '@nestjs/core';
<<<<<<< HEAD:PRACTICA FINAL/backend/apps/auth-service/src/main.ts
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const grpcPort = process.env.AUTH_GRPC_PORT || '50051';
  const host = '0.0.0.0';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: process.env.NODE_ENV === 'production'
        ? join(__dirname, '../../proto/auth.proto')
        : join(process.cwd(), 'proto/auth.proto'),
      url: `${host}:${grpcPort}`,
      keepalive: {
        keepaliveTimeMs: 10000,
        keepaliveTimeoutMs: 5000,
        keepalivePermitWithoutCalls: 1,
      },
    },
  });

  await app.listen();
  console.log(`Auth Service running on ${host}:${grpcPort}`);
}

=======
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthServiceModule);
  await app.listen(process.env.AUTH_GRPC_PORT ?? 5001);
}
>>>>>>> origin/feature/201908327:backend/apps/auth-service/src/main.ts
bootstrap();
