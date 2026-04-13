import {
  Entity, PrimaryColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { TicketEntity } from './ticket.entity';

@Entity('comments')
export class CommentEntity {
  @PrimaryColumn({ type: 'char', length: 36 })
  id!: string;

  @Column({ name: 'ticket_id', type: 'char', length: 36 })
  ticketId!: string;

  @Column({ name: 'author_id', type: 'char', length: 36 })
  authorId!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'is_internal', type: 'tinyint', default: 0 })
  isInternal!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => TicketEntity, (t) => t.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: TicketEntity;
}
