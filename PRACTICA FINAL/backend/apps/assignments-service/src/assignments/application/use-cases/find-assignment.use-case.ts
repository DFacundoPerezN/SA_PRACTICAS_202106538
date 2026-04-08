import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  ASSIGNMENT_REPOSITORY,
} from '../interfaces/assignment-repository.interface';
import type {
  IAssignmentRepository,
  FindAssignmentsFilter,
  FindByTechnicianFilter,
} from '../interfaces/assignment-repository.interface';
import { AssignmentEntity }        from '../../domain/assignment.entity';
import { TechnicianWorkloadEntity } from '../../domain/technician-workload.entity';

@Injectable()
export class FindAssignmentUseCase {
  constructor(
    @Inject(ASSIGNMENT_REPOSITORY) private readonly assignRepo: IAssignmentRepository,
  ) {}

  async findById(id: string): Promise<AssignmentEntity> {
    const a = await this.assignRepo.findById(id);
    if (!a) throw new NotFoundException(`Assignment ${id} not found`);
    return a;
  }

  async findByTicket(ticketId: string): Promise<AssignmentEntity> {
    const a = await this.assignRepo.findByTicket(ticketId);
    if (!a) throw new NotFoundException(`No active assignment found for ticket ${ticketId}`);
    return a;
  }

  findByTechnician(filter: FindByTechnicianFilter): Promise<AssignmentEntity[]> {
    return this.assignRepo.findByTechnician(filter);
  }

  findAssignments(filter: FindAssignmentsFilter): Promise<{ assignments: AssignmentEntity[]; total: number }> {
    return this.assignRepo.findAssignments(filter);
  }

  getWorkload(): Promise<TechnicianWorkloadEntity[]> {
    return this.assignRepo.getWorkload();
  }
}
