import {
  Controller, Get, Post, Patch, Body, Param,
  Query, HttpCode, HttpStatus, UseGuards,
  Inject, OnModuleInit, Logger, Request,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  IsString, IsNotEmpty, IsOptional, IsInt,
  IsBoolean, Min, Max, IsIn, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles }        from '../common/decorators/roles.decorator';

// ── DTOs ─────────────────────────────────────────────────────────────────────

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsInt()
  @Min(1)
  @Max(6)
  @Type(() => Number)
  category_id!: number;

  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  priority_id!: number;
}

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  priority_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  @Type(() => Number)
  category_id?: number;
}

export class ChangeStatusDto {
  @IsString()
  @IsIn(['en_progreso', 'resuelto', 'cerrado', 'reabierto'])
  status!: string;
}

export class AddCommentDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_internal?: boolean;
}

export class FindTicketsQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['abierto', 'en_progreso', 'resuelto', 'cerrado', 'reabierto'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1) @Max(4)
  priority_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1) @Max(6)
  category_id?: number;

  @IsOptional()
  @IsString()
  assigned_to?: string;

  @IsOptional()
  @IsString()
  created_by?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class MyTicketsQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['abierto', 'en_progreso', 'resuelto', 'cerrado', 'reabierto'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class SearchQueryDto {
  @IsString()
  @IsNotEmpty()
  q!: string;

  @IsOptional()
  @IsString()
  @IsIn(['abierto', 'en_progreso', 'resuelto', 'cerrado', 'reabierto'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1) @Max(4)
  priority_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1) @Max(6)
  category_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

// ── gRPC service interface ────────────────────────────────────────────────────

interface TicketsGrpcService {
  createTicket(data: any): any;
  findTicketById(data: any): any;
  findTickets(data: any): any;
  findMyTickets(data: any): any;
  updateTicket(data: any): any;
  changeStatus(data: any): any;
  assignTicket(data: any): any;
  addComment(data: any): any;
  findComments(data: any): any;
  searchTickets(data: any): any;
}

// ── Controller ───────────────────────────────────────────────────────────────

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController implements OnModuleInit {
  private readonly logger = new Logger(TicketsController.name);
  private ticketsService!: TicketsGrpcService;

  constructor(
    @Inject('TICKETS_GRPC_CLIENT') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.ticketsService = this.client.getService<TicketsGrpcService>('TicketsService');
  }

  /** POST /api/tickets — RF-06 */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTicket(@Body() dto: CreateTicketDto, @Request() req: any) {
    this.logger.log(`createTicket → user=${req.user.userId}`);
    return firstValueFrom(
      this.ticketsService.createTicket({
        title:       dto.title,
        description: dto.description,
        categoryId:  dto.category_id,
        priorityId:  dto.priority_id,
        createdBy:   req.user.userId,
      }),
    );
  }

  /**
   * GET /api/tickets/search — RF-13
   * MUST be declared before /:id so Express does not treat "search" as an id.
   */
  @Get('search')
  @Roles('tecnico', 'administrador')
  async searchTickets(@Query() query: SearchQueryDto) {
    this.logger.log(`searchTickets → q="${query.q}"`);
    return firstValueFrom(
      this.ticketsService.searchTickets({
        query:      query.q,
        status:     query.status     || '',
        priorityId: query.priority_id || 0,
        categoryId: query.category_id || 0,
        page:       query.page        || 1,
        limit:      query.limit       || 20,
      }),
    );
  }

  /** GET /api/tickets/my — cliente lists own tickets */
  @Get('my')
  async findMyTickets(@Query() query: MyTicketsQueryDto, @Request() req: any) {
    this.logger.log(`findMyTickets → user=${req.user.userId}`);
    return firstValueFrom(
      this.ticketsService.findMyTickets({
        userId: req.user.userId,
        status: query.status || '',
        page:   query.page   || 1,
        limit:  query.limit  || 20,
      }),
    );
  }

  /** GET /api/tickets — RF-07 */
  @Get()
  @Roles('tecnico', 'administrador')
  async findTickets(@Query() query: FindTicketsQueryDto) {

    //problema con tildes, arreflarlo en el servicio de tickets con decodeURIComponent

    this.logger.log(`findTickets → page=${query.page}`);
    return firstValueFrom(
      this.ticketsService.findTickets({
        status:     query.status      || '',
        priorityId: query.priority_id || 0,
        categoryId: query.category_id || 0,
        assignedTo: query.assigned_to || '',
        createdBy:  query.created_by  || '',
        from:       query.from        || '',
        to:         query.to          || '',
        page:       query.page        || 1,
        limit:      query.limit       || 20,
      }),
    );
  }

  /** GET /api/tickets/:id — RF-08 */
  @Get(':id')
  async findTicketById(@Param('id') id: string) {
    this.logger.log(`findTicketById → ${id}`);
    return firstValueFrom(this.ticketsService.findTicketById({ id }));
  }

  /** PATCH /api/tickets/:id — RF-09 */
  @Patch(':id')
  @Roles('tecnico', 'administrador')
  async updateTicket(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Request() req: any,
  ) {
    this.logger.log(`updateTicket → ${id}`);
    return firstValueFrom(
      this.ticketsService.updateTicket({
        id,
        description: dto.description || '',
        priorityId:  dto.priority_id || 0,
        categoryId:  dto.category_id || 0,
        changedBy:   req.user.userId,
      }),
    );
  }

  /** PATCH /api/tickets/:id/status — RF-10 */
  @Patch(':id/status')
  @Roles('tecnico', 'administrador')
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @Request() req: any,
  ) {
    this.logger.log(`changeStatus → ${id} to ${dto.status}`);
    return firstValueFrom(
      this.ticketsService.changeStatus({
        id,
        status:    dto.status,
        changedBy: req.user.userId,
      }),
    );
  }

  /** POST /api/tickets/:id/comments — RF-12 */
  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @Param('id') ticketId: string,
    @Body() dto: AddCommentDto,
    @Request() req: any,
  ) {
    this.logger.log(`addComment → ticket=${ticketId} internal=${dto.is_internal}`);
    return firstValueFrom(
      this.ticketsService.addComment({
        ticketId,
        authorId:   req.user.userId,
        content:    dto.content,
        isInternal: dto.is_internal ?? false,
      }),
    );
  }

  /** GET /api/tickets/:id/comments */
  @Get(':id/comments')
  async findComments(@Param('id') ticketId: string, @Request() req: any) {
    this.logger.log(`findComments → ticket=${ticketId}`);
    // técnicos y admins ven comentarios internos; clientes no
    const includeInternal = ['tecnico', 'administrador'].includes(req.user.role);
    return firstValueFrom(
      this.ticketsService.findComments({ ticketId, includeInternal }),
    );
  }
}
