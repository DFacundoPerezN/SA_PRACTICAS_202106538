import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import {
  IAssignmentEventPublisher,
  AssignmentCreatedPayload,
} from '../../application/interfaces/event-publisher.interface';

export const ASSIGNMENTS_RABBITMQ_CLIENT = 'ASSIGNMENTS_RABBITMQ_CLIENT';

export const ASSIGNMENT_EVENTS = {
  TICKET_ASSIGNED: 'ticket.assigned',
} as const;

@Injectable()
export class RabbitMqPublisherService implements IAssignmentEventPublisher {
  private readonly logger = new Logger(RabbitMqPublisherService.name);

  constructor(
    @Inject(ASSIGNMENTS_RABBITMQ_CLIENT) private readonly client: ClientProxy,
  ) {}

  async publishAssignmentCreated(payload: AssignmentCreatedPayload): Promise<void> {
    await this.emit(ASSIGNMENT_EVENTS.TICKET_ASSIGNED, payload);
  }

  private async emit(pattern: string, payload: unknown): Promise<void> {
    try {
      await firstValueFrom(this.client.emit(pattern, payload));
      this.logger.debug(`Published [${pattern}]`);
    } catch (err) {
      this.logger.error(`Failed to publish [${pattern}]: ${(err as Error).message}`);
      // Never re-throw — messaging failure must not crash the gRPC response
    }
  }
}
