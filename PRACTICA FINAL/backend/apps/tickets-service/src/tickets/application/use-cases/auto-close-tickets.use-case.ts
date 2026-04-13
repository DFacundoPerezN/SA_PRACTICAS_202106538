import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TICKET_REPOSITORY } from '../interfaces/ticket-repository.interface';
import type { ITicketRepository } from '../interfaces/ticket-repository.interface';

// Number of inactivity days before auto-closing a resolved ticket.
// Override via AUTO_CLOSE_DAYS env var.
const DEFAULT_INACTIVITY_DAYS = 7;

@Injectable()
export class AutoCloseTicketsUseCase {
  private readonly logger = new Logger(AutoCloseTicketsUseCase.name);

  constructor(
    @Inject(TICKET_REPOSITORY) private readonly ticketRepo: ITicketRepository,
  ) {}

  async execute(): Promise<number> {
    const days = parseInt(process.env.AUTO_CLOSE_DAYS ?? String(DEFAULT_INACTIVITY_DAYS), 10);
    const staleTickets = await this.ticketRepo.findStaleResolved(days);

    if (staleTickets.length === 0) return 0;

    this.logger.log(`Auto-closing ${staleTickets.length} stale resolved ticket(s)`);

    const closedStatus = await this.ticketRepo.findStatusByName('cerrado');
    if (!closedStatus) {
      this.logger.error('Status "cerrado" not found in DB — skipping auto-close');
      return 0;
    }

    let closed = 0;
    for (const ticket of staleTickets) {
      try {
        await this.ticketRepo.updateStatus(ticket.id, closedStatus.id, {
          closedAt: new Date(),
        });

        await this.ticketRepo.addHistory({
          id:           randomUUID(),
          ticketId:     ticket.id,
          changedBy:    'system',
          fieldChanged: 'status',
          oldValue:     'resuelto',
          newValue:     'cerrado',
        });

        closed++;
      } catch (err) {
        this.logger.error(`Failed to auto-close ticket ${ticket.id}`, err);
      }
    }

    this.logger.log(`Auto-close complete: ${closed} ticket(s) closed`);
    return closed;
  }
}
