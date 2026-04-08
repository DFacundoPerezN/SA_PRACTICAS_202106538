import {
  Entity, PrimaryColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { TicketEntity } from './ticket.entity';

@Entity('ticket_history')
export class TicketHistoryEntity {
  @PrimaryColumn({ type: 'char', length: 36 })
  id!: string;

  @Column({ name: 'ticket_id', type: 'char', length: 36 })
  ticketId!: string;

  @Column({ name: 'changed_by', type: 'char', length: 36 })
  changedBy!: string;

  @Column({ name: 'field_changed', type: 'varchar', length: 50 })
  fieldChanged!: string;

  @Column({ name: 'old_value', type: 'varchar', length: 255, nullable: true, default: null })
  oldValue!: string | null;

  @Column({ name: 'new_value', type: 'varchar', length: 255, nullable: true, default: null })
  newValue!: string | null;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt!: Date;

  @ManyToOne(() => TicketEntity, (t) => t.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: TicketEntity;
}
