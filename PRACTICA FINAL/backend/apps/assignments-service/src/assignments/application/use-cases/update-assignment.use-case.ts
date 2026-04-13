import {
  Inject, Injectable,
  NotFoundException, BadRequestException,
} from '@nestjs/common';

import {
  ASSIGNMENT_REPOSITORY,
} from '../interfaces/assignment-repository.interface';
import type { IAssignmentRepository } from '../interfaces/assignment-repository.interface';
import {
  TICKETS_GRPC_CLIENT_TOKEN,
} from '../interfaces/tickets-grpc-client.interface';
import type { ITicketsGrpcClient } from '../interfaces/tickets-grpc-client.interface';
import { AssignmentEntity } from '../../domain/assignment.entity';

export interface UpdateAssignmentInput {
  id:            string;
  technicianId?: string;   // new technician for reassignment
  status?:       string;   // 'reasignado' | 'cerrado'
  notes?:        string;
  updatedBy:     string;
}

@Injectable()
export class UpdateAssignmentUseCase {
  constructor(
    @Inject(ASSIGNMENT_REPOSITORY)     private readonly assignRepo:    IAssignmentRepository,
    @Inject(TICKETS_GRPC_CLIENT_TOKEN) private readonly ticketsClient: ITicketsGrpcClient,
  ) {}

  async execute(input: UpdateAssignmentInput): Promise<AssignmentEntity> {
    const assignment = await this.assignRepo.findById(input.id);
    if (!assignment) throw new NotFoundException(`Assignment ${input.id} not found`);

    if (assignment.status?.name === 'cerrado') {
      throw new BadRequestException('Cannot modify a closed assignment');
    }

    const data: Partial<Pick<AssignmentEntity, 'technicianId' | 'statusId' | 'notes' | 'closedAt'>> = {};

    // ── Reassignment ────────────────────────────────────────────────────────
    if (input.technicianId && input.technicianId !== assignment.technicianId) {
      const reasignadoStatus = await this.assignRepo.findStatusByName('reasignado');
      if (!reasignadoStatus) throw new NotFoundException('Status "reasignado" not found');

      // Adjust workload: decrement old technician, increment new one
      await this.assignRepo.upsertWorkload(assignment.technicianId, -1);
      await this.assignRepo.upsertWorkload(input.technicianId, +1);

      // Update assigned_to on the ticket (non-blocking)
      this.ticketsClient.assignTicket({
        ticketId:     assignment.ticketId,
        technicianId: input.technicianId,
        assignedBy:   input.updatedBy,
      }).catch(() => { /* non-blocking */ });

      data.technicianId = input.technicianId;
      data.statusId     = reasignadoStatus.id;
    }

    // ── Close assignment ────────────────────────────────────────────────────
    if (input.status === 'cerrado') {
      const cerradoStatus = await this.assignRepo.findStatusByName('cerrado');
      if (!cerradoStatus) throw new NotFoundException('Status "cerrado" not found');

      data.statusId  = cerradoStatus.id;
      data.closedAt  = new Date();

      // Decrement workload for current technician
      const currentTechnicianId = input.technicianId ?? assignment.technicianId;
      await this.assignRepo.upsertWorkload(currentTechnicianId, -1);
    }

    if (input.notes !== undefined) data.notes = input.notes;

    return this.assignRepo.updateAssignment(input.id, data);
  }
}
