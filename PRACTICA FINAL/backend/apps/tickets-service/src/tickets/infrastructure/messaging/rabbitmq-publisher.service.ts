import { Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  IEventPublisher,
  TicketCreatedPayload,
  TicketAssignedPayload,
  TicketStatusUpdatedPayload,
} from '../../application/interfaces/event-publisher.interface';

export const RABBITMQ_CLIENT = 'RABBITMQ_CLIENT';

// Routing keys (event patterns) — must match what assignments-service
// binds with @EventPattern() in its RabbitMQ consumer controller.
export const EVENTS = {
  TICKET_CREATED:        'ticket.created',
  TICKET_ASSIGNED:       'ticket.assigned',
  TICKET_STATUS_UPDATED: 'ticket.status.updated',
} as const;

@Injectable()
export class RabbitMqPublisherService implements IEventPublisher {
  private readonly logger = new Logger(RabbitMqPublisherService.name);

  constructor(
    @Inject(RABBITMQ_CLIENT) private readonly client: ClientProxy,
  ) {}

  async publishTicketCreated(payload: TicketCreatedPayload): Promise<void> {
    await this.emit(EVENTS.TICKET_CREATED, payload);
  }

  async publishTicketAssigned(payload: TicketAssignedPayload): Promise<void> {
    await this.emit(EVENTS.TICKET_ASSIGNED, payload);
  }

  async publishTicketStatusUpdated(payload: TicketStatusUpdatedPayload): Promise<void> {
    await this.emit(EVENTS.TICKET_STATUS_UPDATED, payload);
  }

  private async emit(pattern: string, payload: unknown): Promise<void> {
    try {
      await firstValueFrom(this.client.emit(pattern, payload));
      this.logger.debug(`Published [${pattern}]`);
    } catch (err) {
      this.logger.error(`Failed to publish [${pattern}]: ${(err as Error).message}`);
      // Never re-throw — a messaging failure must not break the HTTP/gRPC response
    }
  }
}
