import {
  Entity, PrimaryColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { AssignmentStatusEntity } from './assignment-status.entity';

@Entity('assignments')
export class AssignmentEntity {
  @PrimaryColumn({ type: 'char', length: 36 })
  id!: string;

  @Column({ name: 'ticket_id', type: 'char', length: 36 })
  ticketId!: string;

  @Column({ name: 'technician_id', type: 'char', length: 36 })
  technicianId!: string;

  @Column({ name: 'assigned_by', type: 'char', length: 36, nullable: true, default: null })
  assignedBy!: string | null;

  @Column({ name: 'status_id', type: 'tinyint', default: 2 })
  statusId!: number;

  @Column({ name: 'notes', type: 'text', nullable: true, default: null })
  notes!: string | null;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt!: Date;

  @Column({ name: 'closed_at', type: 'datetime', nullable: true, default: null })
  closedAt!: Date | null;

  @ManyToOne(() => AssignmentStatusEntity, (s) => s.assignments)
  @JoinColumn({ name: 'status_id' })
  status!: AssignmentStatusEntity;
}
