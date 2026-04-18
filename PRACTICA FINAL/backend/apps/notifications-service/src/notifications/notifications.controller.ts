import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { NotificationsService } from './application/notifications.service';
import { NotificationEntity }   from './domain/notification.entity';

function toNotificationResponse(n: NotificationEntity) {
  return {
    id:               n.id,
    recipientId:      n.recipientId,
    ticketId:         n.ticketId,
    notificationType: n.notificationType?.name ?? '',
    channel:          n.channel,
    subject:          n.subject,
    body:             n.body,
    sent:             n.sent,
    sentAt:           n.sentAt?.toISOString()  ?? '',
    errorMessage:     n.errorMessage           ?? '',
    createdAt:        n.createdAt?.toISOString() ?? '',
  };
}

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @GrpcMethod('NotificationsService', 'FindNotifications')
  async findNotifications(data: {
    recipientId?: string;
    ticketId?:    string;
    sent?:        boolean;
    page?:        number;
    limit?:       number;
  }) {
    const { notifications, total } = await this.notificationsService.findAll({
      recipientId: data.recipientId || undefined,
      ticketId:    data.ticketId    || undefined,
      sent:        data.sent,
      page:        data.page  || 1,
      limit:       data.limit || 20,
    });

    return {
      notifications: notifications.map(toNotificationResponse),
      total,
      page:  data.page  || 1,
      limit: data.limit || 20,
    };
  }

  @GrpcMethod('NotificationsService', 'FindByRecipient')
  async findByRecipient(data: {
    recipientId: string;
    page?:       number;
    limit?:      number;
  }) {
    const page  = data.page  || 1;
    const limit = data.limit || 20;
    const { notifications, total } = await this.notificationsService.findByRecipient(
      data.recipientId,
      page,
      limit,
    );

    return {
      notifications: notifications.map(toNotificationResponse),
      total,
      page,
      limit,
    };
  }
}
