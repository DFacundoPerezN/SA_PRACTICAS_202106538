import { NotificationEntity }     from '../../domain/notification.entity';
import { NotificationTypeEntity } from '../../domain/notification-type.entity';

export interface CreateNotificationData {
  id:                 string;
  recipientId:        string;
  ticketId:           string;
  notificationTypeId: number;
  subject:            string;
  body:               string;
}

export interface FindNotificationsFilter {
  recipientId?: string;
  ticketId?:    string;
  sent?:        boolean;
  page?:        number;
  limit?:       number;
}

export interface INotificationRepository {
  create(data: CreateNotificationData): Promise<NotificationEntity>;
  markSent(id: string, sentAt: Date): Promise<void>;
  markFailed(id: string, errorMessage: string): Promise<void>;
  findById(id: string): Promise<NotificationEntity | null>;
  findAll(filter: FindNotificationsFilter): Promise<{ notifications: NotificationEntity[]; total: number }>;
  findByRecipient(recipientId: string, page: number, limit: number): Promise<{ notifications: NotificationEntity[]; total: number }>;
  findTypeByName(name: string): Promise<NotificationTypeEntity | null>;
}

export const NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');
