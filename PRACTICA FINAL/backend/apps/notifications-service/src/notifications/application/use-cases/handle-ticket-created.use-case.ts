import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { NOTIFICATION_REPOSITORY } from '../interfaces/notification-repository.interface';
import type { INotificationRepository } from '../interfaces/notification-repository.interface';
import { USERS_GRPC_CLIENT_TOKEN } from '../interfaces/users-grpc-client.interface';
import type { IUsersGrpcClient } from '../interfaces/users-grpc-client.interface';
import { EMAIL_SENDER } from '../interfaces/email-sender.interface';
import type { IEmailSender } from '../interfaces/email-sender.interface';

export interface TicketCreatedEvent {
  ticketId:   string;
  title:      string;
  categoryId: number;
  priorityId: number;
  createdBy:  string;   // userId of the client who opened the ticket
  createdAt:  string;
}

@Injectable()
export class HandleTicketCreatedUseCase {
  private readonly logger = new Logger(HandleTicketCreatedUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifRepo: INotificationRepository,
    @Inject(USERS_GRPC_CLIENT_TOKEN) private readonly usersClient: IUsersGrpcClient,
    @Inject(EMAIL_SENDER)            private readonly emailSender: IEmailSender,
  ) {}

  async execute(event: TicketCreatedEvent): Promise<void> {
    this.logger.log(`Processing ticket.created for ticket ${event.ticketId}`);

    // Resolve recipient email from users-service
    const user = await this.usersClient.findById(event.createdBy);
    if (!user) {
      this.logger.warn(`User ${event.createdBy} not found — skipping notification for ticket ${event.ticketId}`);
      return;
    }

    const notifType = await this.notifRepo.findTypeByName('ticket_created');
    if (!notifType) {
      this.logger.error('Notification type "ticket_created" not found in DB');
      return;
    }

    const subject = `Tu ticket ha sido creado: ${event.title}`;
    const body    = this.buildTicketCreatedHtml(user.name, event);

    const notif = await this.notifRepo.create({
      id:                 randomUUID(),
      recipientId:        event.createdBy,
      ticketId:           event.ticketId,
      notificationTypeId: notifType.id,
      subject,
      body,
    });

    try {
      await this.emailSender.send({ to: user.email, subject, html: body });
      await this.notifRepo.markSent(notif.id, new Date());
      this.logger.log(`Email sent to ${user.email} for ticket ${event.ticketId}`);
    } catch (err) {
      const msg = (err as Error).message;
      await this.notifRepo.markFailed(notif.id, msg);
      this.logger.error(`Failed to send email for ticket ${event.ticketId}: ${msg}`);
    }
  }

  private buildTicketCreatedHtml(name: string, event: TicketCreatedEvent): string {
    return `
      <h2>Hola, ${name}</h2>
      <p>Tu ticket ha sido registrado exitosamente en nuestro sistema de soporte.</p>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;">
        <tr><td><strong>ID del ticket</strong></td><td>${event.ticketId}</td></tr>
        <tr><td><strong>Título</strong></td><td>${event.title}</td></tr>
        <tr><td><strong>Fecha de creación</strong></td><td>${new Date(event.createdAt).toLocaleString('es-GT')}</td></tr>
      </table>
      <p>Un técnico será asignado pronto. Te notificaremos cuando eso ocurra.</p>
    `;
  }
}
