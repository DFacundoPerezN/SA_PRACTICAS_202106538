import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('technician_workload')
export class TechnicianWorkloadEntity {
  @PrimaryColumn({ name: 'technician_id', type: 'char', length: 36 })
  technicianId!: string;

  @Column({ name: 'active_tickets', type: 'int', default: 0 })
  activeTickets!: number;

  @UpdateDateColumn({ name: 'last_updated' })
  lastUpdated!: Date;
}
