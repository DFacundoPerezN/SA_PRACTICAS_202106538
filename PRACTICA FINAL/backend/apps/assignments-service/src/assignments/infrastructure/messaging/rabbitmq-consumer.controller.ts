import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AssignmentsService } from '../../application/assignments.service';
import type { TicketCreatedEvent } from '../../application/use-cases/auto-assign.use-case';
import type { UserCreatedEvent } from '../../application/use-cases/handle-user-created.use-case';
import type { TicketStatusUpdatedEvent } from '../../application/use-cases/handle-ticket-closed.use-case';

/**
 * This controller is registered on the RMQ microservice transport (not gRPC).
 * NestJS hybrid app exposes both transports simultaneously.
 *
 * Patterns handled:
 *  - 'ticket.created'        → published by tickets-service (RF-06 auto-assign)
 *  - 'user.created'          → published by users-service   (RF-22 workload seed)
 *  - 'ticket.status.updated' → published by tickets-service (RF-22 workload decrement on close)
 */
@Controller()
export class RabbitMqConsumerController {
  private readonly logger = new Logger(RabbitMqConsumerController.name);

  constructor(private readonly assignmentsService: AssignmentsService) {}

  // ── ticket.created → auto-assign ─────────────────────────────────────────

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

  // ── user.created → seed technician_workload ───────────────────────────────

  @EventPattern('user.created')
  async handleUserCreated(@Payload() event: UserCreatedEvent): Promise<void> {
    this.logger.log(
      `Received user.created for user ${event.userId} with role '${event.role}'`,
    );
    try {
      await this.assignmentsService.handleUserCreated(event);
    } catch (err) {
      this.logger.error(
        `handleUserCreated failed for user ${event.userId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  // ── ticket.status.updated → decrement workload on close ───────────────────

  @EventPattern('ticket.status.updated')
  async handleTicketStatusUpdated(@Payload() event: TicketStatusUpdatedEvent): Promise<void> {
    this.logger.log(
      `Received ticket.status.updated for ticket ${event.ticketId}: ` +
      `${event.oldStatus} → ${event.newStatus}`,
    );
    try {
      await this.assignmentsService.handleTicketStatusUpdated(event);
    } catch (err) {
      this.logger.error(
        `handleTicketStatusUpdated failed for ticket ${event.ticketId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}

