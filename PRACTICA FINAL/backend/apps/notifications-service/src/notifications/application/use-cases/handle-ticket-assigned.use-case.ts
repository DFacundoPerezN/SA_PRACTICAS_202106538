import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  NOTIFICATION_REPOSITORY,
} from '../interfaces/notification-repository.interface';
import type { INotificationRepository } from '../interfaces/notification-repository.interface';
import {
  USERS_GRPC_CLIENT_TOKEN,
} from '../interfaces/users-grpc-client.interface';
import type { IUsersGrpcClient } from '../interfaces/users-grpc-client.interface';
import {
  EMAIL_SENDER,
} from '../interfaces/email-sender.interface';
import type { IEmailSender } from '../interfaces/email-sender.interface';

// ticket.assigned is published by assignments-service (AssignmentCreatedPayload)
export interface TicketAssignedEvent {
  assignmentId: string;
  ticketId:     string;
  technicianId: string;
  assignedBy:   string | null;
  assignedAt:   string;
  isAutomatic:  boolean;
}

@Injectable()
export class HandleTicketAssignedUseCase {
  private readonly logger = new Logger(HandleTicketAssignedUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifRepo: INotificationRepository,
    @Inject(USERS_GRPC_CLIENT_TOKEN) private readonly usersClient: IUsersGrpcClient,
    @Inject(EMAIL_SENDER)            private readonly emailSender: IEmailSender,
  ) {}

  async execute(event: TicketAssignedEvent): Promise<void> {
    this.logger.log(`Processing ticket.assigned for ticket ${event.ticketId}`);

    const notifType = await this.notifRepo.findTypeByName('ticket_assigned');
    if (!notifType) {
      this.logger.error('Notification type "ticket_assigned" not found in DB');
      return;
    }

    const technician = await this.usersClient.findById(event.technicianId);
    if (!technician) {
      this.logger.warn(`Technician ${event.technicianId} not found — skipping notification`);
      return;
    }

    // Notify the technician about their new assignment
    await this.sendAndRecord({
      recipientId:        event.technicianId,
      ticketId:           event.ticketId,
      notificationTypeId: notifType.id,
      to:                 technician.email,
      subject:            `Nuevo ticket asignado: ${event.ticketId}`,
      html:               this.buildTechnicianHtml(technician.name, event),
    });

    this.logger.log(`Assignment notifications sent for ticket ${event.ticketId}`);
  }

  private async sendAndRecord(opts: {
    recipientId:        string;
    ticketId:           string;
    notificationTypeId: number;
    to:                 string;
    subject:            string;
    html:               string;
  }): Promise<void> {
    const notif = await this.notifRepo.create({
      id:                 randomUUID(),
      recipientId:        opts.recipientId,
      ticketId:           opts.ticketId,
      notificationTypeId: opts.notificationTypeId,
      subject:            opts.subject,
      body:               opts.html,
    });

    try {
      await this.emailSender.send({ to: opts.to, subject: opts.subject, html: opts.html });
      await this.notifRepo.markSent(notif.id, new Date());
    } catch (err) {
      const msg = (err as Error).message;
      await this.notifRepo.markFailed(notif.id, msg);
      this.logger.error(`Failed to send email to ${opts.to}: ${msg}`);
    }
  }

  private buildTechnicianHtml(name: string, event: TicketAssignedEvent): string {
    const assignedLabel = event.isAutomatic ? 'asignación automática' : 'asignación manual';
    return `
      <h2>Hola, ${name}</h2>
      <p>Se te ha asignado un nuevo ticket (${assignedLabel}).</p>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;">
        <tr><td><strong>ID del ticket</strong></td><td>${event.ticketId}</td></tr>
        <tr><td><strong>Asignado en</strong></td><td>${new Date(event.assignedAt).toLocaleString('es-GT')}</td></tr>
      </table>
      <p>Por favor, atiende este ticket a la brevedad posible.</p>
    `;
  }
}
