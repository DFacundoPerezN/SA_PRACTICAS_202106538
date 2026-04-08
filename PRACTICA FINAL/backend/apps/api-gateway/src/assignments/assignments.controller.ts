import {
  Controller, Get, Post, Patch, Body, Param,
  Query, HttpCode, HttpStatus, UseGuards,
  Inject, OnModuleInit, Logger, Request,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  IsString, IsNotEmpty, IsOptional, IsInt,
  IsIn, Min, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles }        from '../common/decorators/roles.decorator';

// ── DTOs ─────────────────────────────────────────────────────────────────────

export class ManualAssignDto {
  @IsString()
  @IsNotEmpty()
  ticket_id!: string;

  @IsString()
  @IsNotEmpty()
  technician_id!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAssignmentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  technician_id?: string;

  @IsOptional()
  @IsString()
  @IsIn(['reasignado', 'cerrado'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FindAssignmentsQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['pendiente', 'asignado', 'reasignado', 'cerrado'])
  status?: string;

  @IsOptional()
  @IsString()
  technician_id?: string;

  @IsOptional()
  @IsString()
  ticket_id?: string;

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

export class TechnicianAssignmentsQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['pendiente', 'asignado', 'reasignado', 'cerrado'])
  status?: string;
}

// ── gRPC service interface ────────────────────────────────────────────────────

interface AssignmentsGrpcService {
  manualAssign(data: any): any;
  findAssignments(data: any): any;
  findByTicket(data: any): any;
  findByTechnician(data: any): any;
  getWorkload(data: any): any;
  updateAssignment(data: any): any;
}

// ── Controller ───────────────────────────────────────────────────────────────

@Controller('assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentsController implements OnModuleInit {
  private readonly logger = new Logger(AssignmentsController.name);
  private assignmentsService!: AssignmentsGrpcService;

  constructor(
    @Inject('ASSIGNMENTS_GRPC_CLIENT') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.assignmentsService =
      this.client.getService<AssignmentsGrpcService>('AssignmentsService');
  }

  /** POST /api/assignments — RF-11, RF-16: asignación manual */
  @Post()
  @Roles('administrador', 'tecnico')
  @HttpCode(HttpStatus.CREATED)
  async manualAssign(@Body() dto: ManualAssignDto, @Request() req: any) {
    this.logger.log(`manualAssign → ticket=${dto.ticket_id} technician=${dto.technician_id}`);
    return firstValueFrom(
      this.assignmentsService.manualAssign({
        ticketId:     dto.ticket_id,
        technicianId: dto.technician_id,
        assignedBy:   req.user.userId,
        notes:        dto.notes || '',
      }),
    );
  }

  /**
   * GET /api/assignments/workload
   * Must be declared BEFORE /:id routes to avoid "workload" being treated as an id.
   */
  @Get('workload')
  @Roles('administrador')
  async getWorkload() {
    this.logger.log('getWorkload');
    return firstValueFrom(this.assignmentsService.getWorkload({}));
  }

  /** GET /api/assignments/ticket/:ticket_id */
  @Get('ticket/:ticket_id')
  @Roles('administrador', 'tecnico')
  async findByTicket(@Param('ticket_id') ticketId: string) {
    this.logger.log(`findByTicket → ${ticketId}`);
    return firstValueFrom(this.assignmentsService.findByTicket({ ticketId }));
  }

  /** GET /api/assignments/technician/:technician_id */
  @Get('technician/:technician_id')
  @Roles('administrador')
  async findByTechnician(
    @Param('technician_id') technicianId: string,
    @Query() query: TechnicianAssignmentsQueryDto,
  ) {
    this.logger.log(`findByTechnician → ${technicianId}`);
    return firstValueFrom(
      this.assignmentsService.findByTechnician({
        technicianId,
        status: query.status || '',
      }),
    );
  }

  /** GET /api/assignments — lista con filtros */
  @Get()
  @Roles('administrador')
  async findAssignments(@Query() query: FindAssignmentsQueryDto) {
    this.logger.log('findAssignments');
    return firstValueFrom(
      this.assignmentsService.findAssignments({
        status:       query.status        || '',
        technicianId: query.technician_id || '',
        ticketId:     query.ticket_id     || '',
        from:         query.from          || '',
        to:           query.to            || '',
        page:         query.page          || 1,
        limit:        query.limit         || 20,
      }),
    );
  }

  /** PATCH /api/assignments/:id — reasignar o cerrar */
  @Patch(':id')
  @Roles('administrador')
  async updateAssignment(
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
    @Request() req: any,
  ) {
    this.logger.log(`updateAssignment → ${id}`);
    return firstValueFrom(
      this.assignmentsService.updateAssignment({
        id,
        technicianId: dto.technician_id || '',
        status:       dto.status        || '',
        notes:        dto.notes         || '',
        updatedBy:    req.user.userId,
      }),
    );
  }
}
