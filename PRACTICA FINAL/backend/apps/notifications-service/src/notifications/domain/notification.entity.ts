import {
  Entity, PrimaryColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { NotificationTypeEntity } from './notification-type.entity';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryColumn({ type: 'char', length: 36 })
  id!: string;

  @Column({ name: 'recipient_id', type: 'char', length: 36 })
  recipientId!: string;

  @Column({ name: 'ticket_id', type: 'char', length: 36 })
  ticketId!: string;

  @Column({ name: 'notification_type_id', type: 'tinyint' })
  notificationTypeId!: number;

  @Column({ name: 'channel', type: 'varchar', length: 50, default: 'email' })
  channel!: string;

  @Column({ name: 'subject', type: 'varchar', length: 255 })
  subject!: string;

  @Column({ name: 'body', type: 'text' })
  body!: string;

  @Column({ name: 'sent', type: 'tinyint', default: 0 })
  sent!: boolean;

  @Column({ name: 'sent_at', type: 'datetime', nullable: true, default: null })
  sentAt!: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true, default: null })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => NotificationTypeEntity)
  @JoinColumn({ name: 'notification_type_id' })
  notificationType!: NotificationTypeEntity;
}
