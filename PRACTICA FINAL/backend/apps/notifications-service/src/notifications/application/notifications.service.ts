import { Injectable } from '@nestjs/common';

import { HandleTicketCreatedUseCase, TicketCreatedEvent }             from './use-cases/handle-ticket-created.use-case';
import { HandleTicketAssignedUseCase, TicketAssignedEvent }           from './use-cases/handle-ticket-assigned.use-case';
import { HandleTicketStatusUpdatedUseCase, TicketStatusUpdatedEvent } from './use-cases/handle-ticket-status-updated.use-case';
import { FindNotificationsUseCase }                                   from './use-cases/find-notifications.use-case';
import { FindNotificationsFilter }                                    from './interfaces/notification-repository.interface';
import { NotificationEntity }                                         from '../domain/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly handleTicketCreated:       HandleTicketCreatedUseCase,
    private readonly handleTicketAssigned:      HandleTicketAssignedUseCase,
    private readonly handleTicketStatusUpdated: HandleTicketStatusUpdatedUseCase,
    private readonly findNotificationsUseCase:  FindNotificationsUseCase,
  ) {}

  onTicketCreated(event: TicketCreatedEvent): Promise<void> {
    return this.handleTicketCreated.execute(event);
  }

  onTicketAssigned(event: TicketAssignedEvent): Promise<void> {
    return this.handleTicketAssigned.execute(event);
  }

  onTicketStatusUpdated(event: TicketStatusUpdatedEvent): Promise<void> {
    return this.handleTicketStatusUpdated.execute(event);
  }

  findAll(filter: FindNotificationsFilter): Promise<{ notifications: NotificationEntity[]; total: number }> {
    return this.findNotificationsUseCase.findAll(filter);
  }

  findByRecipient(
    recipientId: string,
    page: number,
    limit: number,
  ): Promise<{ notifications: NotificationEntity[]; total: number }> {
    return this.findNotificationsUseCase.findByRecipient(recipientId, page, limit);
  }
}
