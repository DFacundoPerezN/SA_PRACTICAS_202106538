import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TicketEntity } from './ticket.entity';

@Entity('ticket_statuses')
export class TicketStatusEntity {
  @PrimaryGeneratedColumn({ type: 'tinyint' })
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string;

  @OneToMany(() => TicketEntity, (t) => t.status)
  tickets!: TicketEntity[];
}
