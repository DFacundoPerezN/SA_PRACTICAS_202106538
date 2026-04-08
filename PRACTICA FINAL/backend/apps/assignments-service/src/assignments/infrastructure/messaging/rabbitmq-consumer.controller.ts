import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AssignmentsService } from '../../application/assignments.service';
import type { TicketCreatedEvent } from '../../application/use-cases/auto-assign.use-case';

/**
 * This controller is registered on the RMQ microservice transport (not gRPC).
 * NestJS hybrid app exposes both transports simultaneously.
 *
 * Pattern: 'ticket.created'  →  published by tickets-service after RF-06.
 */
@Controller()
export class RabbitMqConsumerController {
  private readonly logger = new Logger(RabbitMqConsumerController.name);

  constructor(private readonly assignmentsService: AssignmentsService) {}

  @EventPattern('ticket.created')
  async handleTicketCreated(@Payload() event: TicketCreatedEvent): Promise<void> {
    this.logger.log(`Received ticket.created for ticket ${event.ticketId}`);
    try {
      const assignment = await this.assignmentsService.autoAssign(event);
      if (assignment) {
        this.logger.log(
          `Auto-assigned ticket ${event.ticketId} → technician ${assignment.technicianId}`,
        );
      }
    } catch (err) {
      // Never throw from an event handler — it would NACK and potentially loop
      this.logger.error(
        `Auto-assign failed for ticket ${event.ticketId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}
