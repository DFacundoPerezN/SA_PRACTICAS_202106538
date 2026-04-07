import { UserEntity } from '../../domain/user.entity';
import { RoleEntity }  from '../../domain/role.entity';

export interface FindAllOptions {
  role?:  string;
  page:   number;
  limit:  number;
}

export interface IUserRepository {
  create(id: string, name: string, email: string, roleId: number): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findAll(options: FindAllOptions): Promise<{ users: UserEntity[]; total: number }>;
  update(id: string, data: Partial<Pick<UserEntity, 'name' | 'email' | 'roleId'>>): Promise<UserEntity>;
  softDelete(id: string): Promise<void>;
  findRoleByName(name: string): Promise<RoleEntity | null>;
  findRoleById(id: number): Promise<RoleEntity | null>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
