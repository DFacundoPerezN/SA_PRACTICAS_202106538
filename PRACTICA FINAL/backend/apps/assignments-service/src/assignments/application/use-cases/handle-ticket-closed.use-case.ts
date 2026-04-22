import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ASSIGNMENT_REPOSITORY
} from '../interfaces/assignment-repository.interface';

import type {
  IAssignmentRepository,
} from '../interfaces/assignment-repository.interface';

export interface TicketStatusUpdatedEvent {
  ticketId:  string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
}

@Injectable()
export class HandleTicketClosedUseCase {
  private readonly logger = new Logger(HandleTicketClosedUseCase.name);

  constructor(
    @Inject(ASSIGNMENT_REPOSITORY) private readonly assignRepo: IAssignmentRepository,
  ) {}

  /**
   * RF-22: When a ticket transitions to 'cerrado', decrement the assigned
   * technician's active_tickets counter so future auto-assigns stay balanced.
   */
  async execute(event: TicketStatusUpdatedEvent): Promise<void> {
    if (event.newStatus !== 'cerrado') {
      this.logger.debug(
        `ticket.status.updated for ${event.ticketId}: newStatus='${event.newStatus}' — no workload action needed`,
      );
      return;
    }

    this.logger.log(
      `ticket.status.updated → cerrado for ticket ${event.ticketId}. Looking up active assignment…`,
    );

    const assignment = await this.assignRepo.findByTicket(event.ticketId);

    if (!assignment) {
      this.logger.warn(
        `No active assignment found for ticket ${event.ticketId} — workload not decremented`,
      );
      return;
    }

    this.logger.log(
      `Decrementing workload for technician ${assignment.technicianId} (ticket ${event.ticketId} closed)`,
    );

    await this.assignRepo.upsertWorkload(assignment.technicianId, -1);

    this.logger.log(
      `Workload decremented for technician ${assignment.technicianId}`,
    );
  }
}
