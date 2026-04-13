import {
  Entity, PrimaryGeneratedColumn,
  Column, OneToMany,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('roles')
export class RoleEntity {

  @PrimaryGeneratedColumn({ type: 'tinyint' })
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string;

  @OneToMany(() => UserEntity, (u) => u.role)
  users!: UserEntity[];
}
