import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  INotificationRepository,
  CreateNotificationData,
  FindNotificationsFilter,
} from '../../application/interfaces/notification-repository.interface';

import { NotificationEntity }     from '../../domain/notification.entity';
import { NotificationTypeEntity } from '../../domain/notification-type.entity';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifRepo: Repository<NotificationEntity>,

    @InjectRepository(NotificationTypeEntity)
    private readonly typeRepo: Repository<NotificationTypeEntity>,
  ) {}

  async create(data: CreateNotificationData): Promise<NotificationEntity> {
    const entity = this.notifRepo.create({
      id:                 data.id,
      recipientId:        data.recipientId,
      ticketId:           data.ticketId,
      notificationTypeId: data.notificationTypeId,
      subject:            data.subject,
      body:               data.body,
      sent:               false,
      sentAt:             null,
      errorMessage:       null,
    });
    return this.notifRepo.save(entity);
  }

  async markSent(id: string, sentAt: Date): Promise<void> {
    await this.notifRepo.update(id, { sent: true, sentAt, errorMessage: null });
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    await this.notifRepo.update(id, { sent: false, errorMessage });
  }

  findById(id: string): Promise<NotificationEntity | null> {
    return this.notifRepo.findOne({
      where: { id },
      relations: ['notificationType'],
    });
  }

  async findAll(filter: FindNotificationsFilter): Promise<{ notifications: NotificationEntity[]; total: number }> {
    const page  = filter.page  ?? 1;
    const limit = filter.limit ?? 20;

    const qb = this.notifRepo
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.notificationType', 'nt')
      .orderBy('n.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filter.recipientId) qb.andWhere('n.recipientId = :recipientId', { recipientId: filter.recipientId });
    if (filter.ticketId)    qb.andWhere('n.ticketId = :ticketId',       { ticketId: filter.ticketId });
    if (filter.sent !== undefined) qb.andWhere('n.sent = :sent', { sent: filter.sent });

    const [notifications, total] = await qb.getManyAndCount();
    return { notifications, total };
  }

  async findByRecipient(
    recipientId: string,
    page: number,
    limit: number,
  ): Promise<{ notifications: NotificationEntity[]; total: number }> {
    const [notifications, total] = await this.notifRepo.findAndCount({
      where: { recipientId },
      relations: ['notificationType'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { notifications, total };
  }

  findTypeByName(name: string): Promise<NotificationTypeEntity | null> {
    return this.typeRepo.findOne({ where: { name } });
  }
}
