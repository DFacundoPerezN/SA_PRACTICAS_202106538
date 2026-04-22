import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // ── Global uncaught error handlers ───────────────────────────────────────
  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`, err.stack);
  });

  process.on('unhandledRejection', (reason: any) => {
    logger.error(`Unhandled Rejection: ${reason?.message ?? reason}`);
  });
  // ─────────────────────────────────────────────────────────────────────────

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error', 'debug'],
  });

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter (catches everything, never crashes the app)
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.GATEWAY_PORT || 4000;
  const host = process.env.GATEWAY_HOST || '0.0.0.0';

  await app.listen(port, host);
  logger.log(`API Gateway running on http://${host}:${port}/api`);
}

bootstrap();
