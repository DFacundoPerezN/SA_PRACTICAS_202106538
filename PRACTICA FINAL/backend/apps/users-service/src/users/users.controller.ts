import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UsersService } from './application/users.service';
import { toUserResponse } from './users.mapper';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @GrpcMethod('UsersService', 'CreateUser')
  async createUser(data: {
    id: string; name: string; email: string; role: string;
  }) {
    const user = await this.usersService.createUser({
      id:    data.id,
      name:  data.name,
      email: data.email,
      role:  data.role || 'cliente',
    });
    return toUserResponse(user);
  }

  @GrpcMethod('UsersService', 'FindById')
  async findById(data: { id: string }) {
    const user = await this.usersService.findById(data.id);
    return toUserResponse(user);
  }

  @GrpcMethod('UsersService', 'FindByEmail')
  async findByEmail(data: { email: string }) {
    const user = await this.usersService.findByEmail(data.email);
    return toUserResponse(user);
  }

  @GrpcMethod('UsersService', 'FindAll')
  async findAll(data: { role?: string; page?: number; limit?: number }) {
    const { users, total } = await this.usersService.findAll({
      role:  data.role  || undefined,
      page:  data.page  || 1,
      limit: data.limit || 20,
    });
    return {
      users: users.map(toUserResponse),
      total,
    };
  }

  @GrpcMethod('UsersService', 'UpdateUser')
  async updateUser(data: {
    id: string; name?: string; email?: string; role?: string;
  }) {
    const user = await this.usersService.updateUser({
      id:    data.id,
      name:  data.name,
      email: data.email,
      role:  data.role,
    });
    return toUserResponse(user);
  }

  @GrpcMethod('UsersService', 'DeleteUser')
  async deleteUser(data: { id: string }) {
    const result = await this.usersService.deleteUser(data.id);
    return result;
  }
}
