import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from '../../application/notifications.service';
import type { TicketCreatedEvent }       from '../../application/use-cases/handle-ticket-created.use-case';
import type { TicketAssignedEvent }      from '../../application/use-cases/handle-ticket-assigned.use-case';
import type { TicketStatusUpdatedEvent } from '../../application/use-cases/handle-ticket-status-updated.use-case';

/**
 * Consumes events from the shared RabbitMQ exchange.
 * Registered on the RMQ microservice transport (not gRPC).
 *
 * Patterns handled:
 *  - 'ticket.created'        → published by tickets-service
 *  - 'ticket.assigned'       → published by assignments-service
 *  - 'ticket.status.updated' → published by tickets-service
 */
@Controller()
export class RabbitMqConsumerController {
  private readonly logger = new Logger(RabbitMqConsumerController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('ticket.created')
  async handleTicketCreated(@Payload() event: TicketCreatedEvent): Promise<void> {
    this.logger.log(`Received ticket.created for ticket ${event.ticketId}`);
    try {
      await this.notificationsService.onTicketCreated(event);
    } catch (err) {
      // Never throw from an event handler — it would NACK and potentially loop
      this.logger.error(
        `handleTicketCreated failed for ticket ${event.ticketId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  @EventPattern('ticket.assigned')
  async handleTicketAssigned(@Payload() event: TicketAssignedEvent): Promise<void> {
    this.logger.log(`Received ticket.assigned for ticket ${event.ticketId}`);
    try {
      await this.notificationsService.onTicketAssigned(event);
    } catch (err) {
      this.logger.error(
        `handleTicketAssigned failed for ticket ${event.ticketId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  @EventPattern('ticket.status.updated')
  async handleTicketStatusUpdated(@Payload() event: TicketStatusUpdatedEvent): Promise<void> {
    this.logger.log(
      `Received ticket.status.updated for ticket ${event.ticketId}: ` +
      `${event.oldStatus} → ${event.newStatus}`,
    );
    try {
      await this.notificationsService.onTicketStatusUpdated(event);
    } catch (err) {
      this.logger.error(
        `handleTicketStatusUpdated failed for ticket ${event.ticketId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}
