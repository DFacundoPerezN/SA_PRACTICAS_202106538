import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/**
 * LoggingInterceptor
 * Logs the HTTP method, URL and response time for every request.
 * Registered globally in AppModule so every route is covered.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const status = context.switchToHttp().getResponse().statusCode;
          this.logger.log(`${method} ${url} → ${status} [${ms}ms]`);
        },
        error: (err) => {
          const ms = Date.now() - start;
          this.logger.warn(
            `${method} ${url} → ERROR ${err?.status ?? 500} [${ms}ms] — ${err?.message}`,
          );
        },
      }),
    );
  }
}
