import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { IUserRepository, FindAllOptions } from '../../application/interfaces/user-repository.interface';
import { UserEntity } from '../../domain/user.entity';
import { RoleEntity } from '../../domain/role.entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
  ) {}

  async create(id: string, name: string, email: string, roleId: number): Promise<UserEntity> {
    const user = this.userRepo.create({ id, name, email, roleId });
    const saved = await this.userRepo.save(user);
    return (await this.userRepo.findOne({
      where: { id: saved.id },
      relations: ['role'],
    }))!;
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: ['role'],
    });
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async findAll(options: FindAllOptions): Promise<{ users: UserEntity[]; total: number }> {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'role')
      .where('u.deleted_at IS NULL')
      .skip((options.page - 1) * options.limit)
      .take(options.limit);

    if (options.role) {
      qb.andWhere('role.name = :role', { role: options.role });
    }

    const [users, total] = await qb.getManyAndCount();
    return { users, total };
  }

  async update(
    id: string,
    data: Partial<Pick<UserEntity, 'name' | 'email' | 'roleId'>>,
  ): Promise<UserEntity> {
    await this.userRepo.update({ id }, data);
    return (await this.userRepo.findOne({ where: { id }, relations: ['role'] }))!;
  }

  async softDelete(id: string): Promise<void> {
    await this.userRepo.update({ id }, { deletedAt: new Date(), isActive: false });
  }

  findRoleByName(name: string): Promise<RoleEntity | null> {
    return this.roleRepo.findOne({ where: { name } });
  }

  findRoleById(id: number): Promise<RoleEntity | null> {
    return this.roleRepo.findOne({ where: { id } });
  }
}
