import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * AllExceptionsFilter
 * Catches every thrown exception (HTTP, gRPC, runtime) and returns
 * a consistent JSON error envelope — the application never crashes.
 *
 * gRPC errors surfaced by @nestjs/microservices contain a `code`
 * and `details` field. We map gRPC status codes to HTTP status codes
 * so the REST client always gets a meaningful HTTP response.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.resolve(exception);

    this.logger.error(
      `[${request.method}] ${request.url} → ${status}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  private resolve(exception: unknown): { status: number; message: string } {
    // NestJS HTTP exceptions (BadRequestException, UnauthorizedException, etc.)
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : (res as any)?.message ?? exception.message;
      return {
        status: exception.getStatus(),
        message: Array.isArray(message) ? message.join('; ') : message,
      };
    }

    // gRPC errors forwarded by @nestjs/microservices
    if (this.isGrpcError(exception)) {
      return {
        status: this.grpcCodeToHttp((exception as any).code),
        message: (exception as any).details ?? (exception as any).message ?? 'gRPC error',
      };
    }

    // Unexpected runtime errors
    const msg =
      exception instanceof Error ? exception.message : 'Internal server error';
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: msg };
  }

  private isGrpcError(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      typeof (err as any).code === 'number'
    );
  }

  /**
   * Maps gRPC status codes to HTTP status codes.
   * https://grpc.github.io/grpc/core/md_doc_statuscodes.html
   */
  private grpcCodeToHttp(code: number): number {
    const map: Record<number, number> = {
      0: 200,  // OK
      1: 499,  // CANCELLED
      2: 500,  // UNKNOWN
      3: 400,  // INVALID_ARGUMENT
      4: 504,  // DEADLINE_EXCEEDED
      5: 404,  // NOT_FOUND
      6: 409,  // ALREADY_EXISTS
      7: 403,  // PERMISSION_DENIED
      8: 429,  // RESOURCE_EXHAUSTED
      9: 400,  // FAILED_PRECONDITION
      10: 409, // ABORTED
      11: 416, // OUT_OF_RANGE
      12: 501, // UNIMPLEMENTED
      13: 500, // INTERNAL
      14: 503, // UNAVAILABLE
      15: 500, // DATA_LOSS
      16: 401, // UNAUTHENTICATED
    };
    return map[code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
