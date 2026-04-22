import { Inject, Injectable } from '@nestjs/common';

import {
  NOTIFICATION_REPOSITORY,
} from '../interfaces/notification-repository.interface';
import type {
  INotificationRepository,
  FindNotificationsFilter,
} from '../interfaces/notification-repository.interface';
import type { NotificationEntity } from '../../domain/notification.entity';

@Injectable()
export class FindNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifRepo: INotificationRepository,
  ) {}

  findAll(filter: FindNotificationsFilter): Promise<{ notifications: NotificationEntity[]; total: number }> {
    return this.notifRepo.findAll(filter);
  }

  findByRecipient(
    recipientId: string,
    page: number,
    limit: number,
  ): Promise<{ notifications: NotificationEntity[]; total: number }> {
    return this.notifRepo.findByRecipient(recipientId, page, limit);
  }
}
