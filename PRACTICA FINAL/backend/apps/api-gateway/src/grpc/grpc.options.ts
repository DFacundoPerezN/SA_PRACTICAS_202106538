import { ClientOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

/**
 * Resolves the path to the proto directory.
 * Works both in development (cwd/proto) and production (dist/../proto).
 */
function protoPath(filename: string): string {
  return process.env.NODE_ENV === 'production'
    ? join(__dirname, '../../proto', filename)
    : join(process.cwd(), 'proto', filename);
}

const keepalive = {
  keepaliveTimeMs:            10_000,
  keepaliveTimeoutMs:         5_000,
  keepalivePermitWithoutCalls: 1,
};

export const authGrpcOptions = (): ClientOptions => ({
  transport: Transport.GRPC,
  options: {
    package:   'auth',
    protoPath: protoPath('auth.proto'),
    url:       process.env.AUTH_SERVICE_URL || 'localhost:50051',
    ...keepalive,
  },
});

export const usersGrpcOptions = (): ClientOptions => ({
  transport: Transport.GRPC,
  options: {
    package:   'users',
    protoPath: protoPath('users.proto'),
    url:       process.env.USERS_SERVICE_URL || 'localhost:50052',
    ...keepalive,
  },
});

export const ticketsGrpcOptions = (): ClientOptions => ({
  transport: Transport.GRPC,
  options: {
    package:   'tickets',
    protoPath: protoPath('tickets.proto'),
    url:       process.env.TICKETS_SERVICE_URL || 'localhost:50053',
    ...keepalive,
  },
});

export const assignmentsGrpcOptions = (): ClientOptions => ({
  transport: Transport.GRPC,
  options: {
    package:   'assignments',
    protoPath: protoPath('assignments.proto'),
    url:       process.env.ASSIGNMENTS_SERVICE_URL || 'localhost:50054',
    ...keepalive,
  },
});
