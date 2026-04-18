import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { NOTIFICATION_REPOSITORY } from '../interfaces/notification-repository.interface';
import type { INotificationRepository } from '../interfaces/notification-repository.interface';
import { USERS_GRPC_CLIENT_TOKEN } from '../interfaces/users-grpc-client.interface';
import type { IUsersGrpcClient } from '../interfaces/users-grpc-client.interface';
import { EMAIL_SENDER } from '../interfaces/email-sender.interface';
import type { IEmailSender } from '../interfaces/email-sender.interface';

export interface TicketStatusUpdatedEvent {
  ticketId:  string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;  // userId who triggered the change
  changedAt: string;
}

// Maps newStatus values to notification_types.name rows already in the DB
const STATUS_TO_NOTIF_TYPE: Record<string, string> = {
  resuelto:  'ticket_resolved',
  cerrado:   'ticket_closed',
  reabierto: 'ticket_reopened',
};

@Injectable()
export class HandleTicketStatusUpdatedUseCase {
  private readonly logger = new Logger(HandleTicketStatusUpdatedUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifRepo: INotificationRepository,
    @Inject(USERS_GRPC_CLIENT_TOKEN) private readonly usersClient: IUsersGrpcClient,
    @Inject(EMAIL_SENDER)            private readonly emailSender: IEmailSender,
  ) {}

  async execute(event: TicketStatusUpdatedEvent): Promise<void> {
    this.logger.log(
      `Processing ticket.status.updated for ticket ${event.ticketId}: ` +
      `${event.oldStatus} → ${event.newStatus}`,
    );

    const notifTypeName = STATUS_TO_NOTIF_TYPE[event.newStatus];
    if (!notifTypeName) {
      // Intermediate statuses like 'en_progreso' don't trigger emails
      this.logger.debug(`No notification configured for status '${event.newStatus}' — skipping`);
      return;
    }

    const notifType = await this.notifRepo.findTypeByName(notifTypeName);
    if (!notifType) {
      this.logger.error(`Notification type "${notifTypeName}" not found in DB`);
      return;
    }

    // Notify the user who triggered the change (technician or client)
    const actor = await this.usersClient.findById(event.changedBy);
    if (!actor) {
      this.logger.warn(`User ${event.changedBy} not found — skipping notification`);
      return;
    }

    const subject = this.buildSubject(event.newStatus, event.ticketId);
    const html    = this.buildHtml(actor.name, event);

    const notif = await this.notifRepo.create({
      id:                 randomUUID(),
      recipientId:        event.changedBy,
      ticketId:           event.ticketId,
      notificationTypeId: notifType.id,
      subject,
      body: html,
    });

    try {
      await this.emailSender.send({ to: actor.email, subject, html });
      await this.notifRepo.markSent(notif.id, new Date());
      this.logger.log(`Status update email sent to ${actor.email} for ticket ${event.ticketId}`);
    } catch (err) {
      const msg = (err as Error).message;
      await this.notifRepo.markFailed(notif.id, msg);
      this.logger.error(`Failed to send status update email: ${msg}`);
    }
  }

  private buildSubject(newStatus: string, ticketId: string): string {
    const labels: Record<string, string> = {
      resuelto:  'Ticket resuelto',
      cerrado:   'Ticket cerrado',
      reabierto: 'Ticket reabierto',
    };
    return `${labels[newStatus] ?? 'Estado actualizado'}: ${ticketId}`;
  }

  private buildHtml(name: string, event: TicketStatusUpdatedEvent): string {
    const statusLabels: Record<string, string> = {
      resuelto:  'Resuelto',
      cerrado:   'Cerrado',
      reabierto: 'Reabierto',
    };
    const newLabel = statusLabels[event.newStatus] ?? event.newStatus;
    const oldLabel = statusLabels[event.oldStatus] ?? event.oldStatus;

    return `
      <h2>Hola, ${name}</h2>
      <p>El estado de tu ticket ha sido actualizado.</p>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;">
        <tr><td><strong>ID del ticket</strong></td><td>${event.ticketId}</td></tr>
        <tr><td><strong>Estado anterior</strong></td><td>${oldLabel}</td></tr>
        <tr><td><strong>Nuevo estado</strong></td><td><strong>${newLabel}</strong></td></tr>
        <tr><td><strong>Fecha del cambio</strong></td><td>${new Date(event.changedAt).toLocaleString('es-GT')}</td></tr>
      </table>
    `;
  }
}
