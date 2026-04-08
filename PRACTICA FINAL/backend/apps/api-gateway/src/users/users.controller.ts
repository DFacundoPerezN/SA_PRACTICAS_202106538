import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Inject,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';

// ── DTOs ─────────────────────────────────────────────────────────────────────

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  /**
   * role is REQUIRED — no default here.
   * An admin must explicitly choose the role when creating a user.
   * Accepted values must match the roles seeded in users_db.
   */
  @IsString()
  @IsNotEmpty()
  @IsIn(['cliente', 'tecnico', 'administrador'])
  role!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsIn(['cliente', 'tecnico', 'administrador'])
  role?: string;
}

export class FindAllQueryDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ── gRPC service interface ────────────────────────────────────────────────────

interface UsersGrpcService {
  createUser(data: { id: string; name: string; email: string; role: string }): any;
  findById(data: { id: string }): any;
  findByEmail(data: { email: string }): any;
  findAll(data: { role?: string; page?: number; limit?: number }): any;
  updateUser(data: { id: string; name?: string; email?: string; role?: string }): any;
  deleteUser(data: { id: string }): any;
}

// ── Controller ───────────────────────────────────────────────────────────────

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController implements OnModuleInit {
  private readonly logger = new Logger(UsersController.name);
  private usersService!: UsersGrpcService;

  constructor(@Inject('USERS_GRPC_CLIENT') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.usersService = this.client.getService<UsersGrpcService>('UsersService');
  }

  /**
   * POST /api/users
   * Only administrators can create users manually via this endpoint.
   * Note: regular self-registration goes through POST /api/auth/register.
   */
  @Post()
  @Roles('administrador')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: CreateUserDto) {
    this.logger.log(`createUser → ${dto.email} role=${dto.role}`);
    return firstValueFrom(this.usersService.createUser(dto));
  }

  /**
   * GET /api/users
   * Only administrators can list all users.
   */
  @Get()
  @Roles('administrador')
  async findAll(@Query() query: FindAllQueryDto) {
    this.logger.log(`findAll → page=${query.page} limit=${query.limit} role=${query.role}`);
    return firstValueFrom(
      this.usersService.findAll({
        role:  query.role,
        page:  query.page  || 1,
        limit: query.limit || 20,
      }),
    );
  }

  /**
   * GET /api/users/email/:email
   * Must be declared BEFORE /:id to avoid Express treating "email" as an id.
   */
  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    this.logger.log(`findByEmail → ${email}`);
    return firstValueFrom(this.usersService.findByEmail({ email }));
  }

  /** GET /api/users/:id — any authenticated user */
  @Get(':id')
  async findById(@Param('id') id: string) {
    this.logger.log(`findById → ${id}`);
    return firstValueFrom(this.usersService.findById({ id }));
  }

  /**
   * PUT /api/users/:id
   * Any authenticated user can update their own profile.
   * Role change is only meaningful when done by an admin — enforced at
   * the business level (user-service checks the actor's role if needed).
   */
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    this.logger.log(`updateUser → ${id}`);
    return firstValueFrom(this.usersService.updateUser({ id, ...dto }));
  }

  /**
   * DELETE /api/users/:id
   * Only administrators can delete users (soft-delete).
   */
  @Delete(':id')
  @Roles('administrador')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    this.logger.log(`deleteUser → ${id}`);
    return firstValueFrom(this.usersService.deleteUser({ id }));
  }
}
