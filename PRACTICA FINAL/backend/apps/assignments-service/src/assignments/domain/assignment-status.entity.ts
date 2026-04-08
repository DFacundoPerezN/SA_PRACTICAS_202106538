import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AssignmentEntity } from './assignment.entity';

@Entity('assignment_statuses')
export class AssignmentStatusEntity {
  @PrimaryGeneratedColumn({ type: 'tinyint' })
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string;

  @OneToMany(() => AssignmentEntity, (a) => a.status)
  assignments!: AssignmentEntity[];
}
