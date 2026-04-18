import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

import {
  IUsersGrpcClient,
  UserInfo,
} from '../../application/interfaces/users-grpc-client.interface';

export const USERS_GRPC_CLIENT = 'USERS_GRPC_CLIENT_INTERNAL';

interface UsersServiceRpc {
  findById(data: { id: string }): Observable<UsersServiceFindByIdResponse>;
}

interface UsersServiceFindByIdResponse {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

/**
 * Calls users-service via gRPC to resolve user details (including email)
 * from a userId. The application layer only knows about IUsersGrpcClient.
 */
@Injectable()
export class UsersGrpcClientService implements IUsersGrpcClient, OnModuleInit {
  private readonly logger = new Logger(UsersGrpcClientService.name);
  private usersRpc!: UsersServiceRpc;

  constructor(
    @Inject(USERS_GRPC_CLIENT) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.usersRpc = this.client.getService<UsersServiceRpc>('UsersService');
  }

  async findById(userId: string): Promise<UserInfo | null> {
    try {
      const response = await firstValueFrom(this.usersRpc.findById({ id: userId }));
      if (!response || !response.id) return null;
      return {
        id:       response.id,
        name:     response.name ?? '',
        email:    response.email ?? '',
        role:     response.role ?? '',
        isActive: response.isActive ?? true,
      };
    } catch (err) {
      this.logger.error(`findById failed for user ${userId}: ${(err as Error).message}`);
      return null;
    }
  }
}
