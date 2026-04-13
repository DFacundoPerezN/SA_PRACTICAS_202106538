import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TicketEntity } from './ticket.entity';

@Entity('priorities')
export class PriorityEntity {
  @PrimaryGeneratedColumn({ type: 'tinyint' })
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string;

  @OneToMany(() => TicketEntity, (t) => t.priority)
  tickets!: TicketEntity[];
}
