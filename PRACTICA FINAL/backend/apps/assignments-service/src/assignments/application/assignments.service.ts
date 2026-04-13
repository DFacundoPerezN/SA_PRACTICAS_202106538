import { Injectable } from '@nestjs/common';

import { ManualAssignUseCase, ManualAssignInput }      from './use-cases/manual-assign.use-case';
import { AutoAssignUseCase, TicketCreatedEvent }       from './use-cases/auto-assign.use-case';
import { UpdateAssignmentUseCase, UpdateAssignmentInput } from './use-cases/update-assignment.use-case';
import { FindAssignmentUseCase }                       from './use-cases/find-assignment.use-case';
import {
  FindAssignmentsFilter,
  FindByTechnicianFilter,
} from './interfaces/assignment-repository.interface';
import { AssignmentEntity }        from '../domain/assignment.entity';
import { TechnicianWorkloadEntity } from '../domain/technician-workload.entity';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly manualAssignUseCase:   ManualAssignUseCase,
    private readonly autoAssignUseCase:     AutoAssignUseCase,
    private readonly updateAssignmentUseCase: UpdateAssignmentUseCase,
    private readonly findAssignmentUseCase: FindAssignmentUseCase,
  ) {}

  manualAssign(input: ManualAssignInput): Promise<AssignmentEntity> {
    return this.manualAssignUseCase.execute(input);
  }

  autoAssign(event: TicketCreatedEvent): Promise<AssignmentEntity | null> {
    return this.autoAssignUseCase.execute(event);
  }

  updateAssignment(input: UpdateAssignmentInput): Promise<AssignmentEntity> {
    return this.updateAssignmentUseCase.execute(input);
  }

  findById(id: string): Promise<AssignmentEntity> {
    return this.findAssignmentUseCase.findById(id);
  }

  findByTicket(ticketId: string): Promise<AssignmentEntity> {
    return this.findAssignmentUseCase.findByTicket(ticketId);
  }

  findByTechnician(filter: FindByTechnicianFilter): Promise<AssignmentEntity[]> {
    return this.findAssignmentUseCase.findByTechnician(filter);
  }

  findAssignments(filter: FindAssignmentsFilter): Promise<{ assignments: AssignmentEntity[]; total: number }> {
    return this.findAssignmentUseCase.findAssignments(filter);
  }

  getWorkload(): Promise<TechnicianWorkloadEntity[]> {
    return this.findAssignmentUseCase.getWorkload();
  }
}
