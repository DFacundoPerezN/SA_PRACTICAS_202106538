import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { NotificationEntity } from './notification.entity';

@Entity('notification_types')
export class NotificationTypeEntity {
  @PrimaryGeneratedColumn({ type: 'tinyint' })
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @OneToMany(() => NotificationEntity, (n) => n.notificationType)
  notifications!: NotificationEntity[];
}
