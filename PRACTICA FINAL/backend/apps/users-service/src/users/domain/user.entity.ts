import {
  Entity, PrimaryColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { RoleEntity } from './role.entity';

@Entity('users')
export class UserEntity {

  @PrimaryColumn({ type: 'char', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'role_id', type: 'tinyint', default: 1 })
  roleId!: number;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive!: boolean;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true, default: null })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => RoleEntity, (r) => r.users)
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;
}
