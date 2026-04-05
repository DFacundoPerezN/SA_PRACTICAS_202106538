import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TicketEntity } from './ticket.entity';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn({ type: 'smallint' })
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @OneToMany(() => TicketEntity, (t) => t.category)
  tickets!: TicketEntity[];
}
