import {
  Entity, PrimaryColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { CategoryEntity }     from './category.entity';
import { PriorityEntity }     from './priority.entity';
import { TicketStatusEntity } from './ticket-status.entity';
import { CommentEntity }      from './comment.entity';
import { TicketHistoryEntity } from './ticket-history.entity';

@Entity('tickets')
export class TicketEntity {
  @PrimaryColumn({ type: 'char', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'category_id', type: 'smallint' })
  categoryId!: number;

  @Column({ name: 'priority_id', type: 'tinyint' })
  priorityId!: number;

  @Column({ name: 'status_id', type: 'tinyint', default: 1 })
  statusId!: number;

  @Column({ name: 'created_by', type: 'char', length: 36 })
  createdBy!: string;

  @Column({ name: 'assigned_to', type: 'char', length: 36, nullable: true, default: null })
  assignedTo!: string | null;

  @Column({ name: 'resolved_at', type: 'datetime', nullable: true, default: null })
  resolvedAt!: Date | null;

  @Column({ name: 'closed_at', type: 'datetime', nullable: true, default: null })
  closedAt!: Date | null;

  @Column({ name: 'auto_closed', type: 'tinyint', default: 0 })
  autoClosed!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // ── Relations ──────────────────────────────────────────────────────────────

  @ManyToOne(() => CategoryEntity, (c) => c.tickets)
  @JoinColumn({ name: 'category_id' })
  category!: CategoryEntity;

  @ManyToOne(() => PriorityEntity, (p) => p.tickets)
  @JoinColumn({ name: 'priority_id' })
  priority!: PriorityEntity;

  @ManyToOne(() => TicketStatusEntity, (s) => s.tickets)
  @JoinColumn({ name: 'status_id' })
  status!: TicketStatusEntity;

  @OneToMany(() => CommentEntity, (c) => c.ticket, { cascade: true })
  comments!: CommentEntity[];

  @OneToMany(() => TicketHistoryEntity, (h) => h.ticket, { cascade: true })
  history!: TicketHistoryEntity[];
}
