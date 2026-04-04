import {
  Entity, PrimaryColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RefreshTokenEntity } from './refresh-token.entity';

@Entity('users_auth')
export class UserAuthEntity {

  @PrimaryColumn({ type: 'char', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => RefreshTokenEntity, (rt) => rt.user, { cascade: true })
  refreshTokens!: RefreshTokenEntity[];
}
