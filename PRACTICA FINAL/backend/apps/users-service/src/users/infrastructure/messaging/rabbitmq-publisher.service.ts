import { Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export const USERS_RABBITMQ_CLIENT = 'USERS_RABBITMQ_CLIENT';

export const USER_EVENTS = {
  USER_CREATED: 'user.created',
} as const;

export interface UserCreatedPayload {
  userId: string;
  name:   string;
  email:  string;
  role:   string;
}

@Injectable()
export class UsersRabbitMqPublisherService {
  private readonly logger = new Logger(UsersRabbitMqPublisherService.name);

  constructor(
    @Inject(USERS_RABBITMQ_CLIENT) private readonly client: ClientProxy,
  ) {}

  async publishUserCreated(payload: UserCreatedPayload): Promise<void> {
    try {
      await firstValueFrom(this.client.emit(USER_EVENTS.USER_CREATED, payload));
      this.logger.debug(`Published [${USER_EVENTS.USER_CREATED}] for user ${payload.userId}`);
    } catch (err) {
      this.logger.error(
        `Failed to publish [${USER_EVENTS.USER_CREATED}]: ${(err as Error).message}`,
      );
      // Never re-throw — messaging failure must not break the gRPC response
    }
  }
}
