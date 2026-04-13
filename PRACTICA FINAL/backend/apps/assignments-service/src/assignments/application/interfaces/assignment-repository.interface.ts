import { AssignmentEntity }        from '../../domain/assignment.entity';
import { AssignmentStatusEntity }  from '../../domain/assignment-status.entity';
import { TechnicianWorkloadEntity } from '../../domain/technician-workload.entity';

// ── Filter types ──────────────────────────────────────────────────────────────

export interface FindAssignmentsFilter {
  status?:       string;
  technicianId?: string;
  ticketId?:     string;
  from?:         string;
  to?:           string;
  page:          number;
  limit:         number;
}

export interface FindByTechnicianFilter {
  technicianId: string;
  status?:      string;
}

// ── Repository contract ───────────────────────────────────────────────────────

export interface IAssignmentRepository {
  // Assignments
  createAssignment(data: {
    id:           string;
    ticketId:     string;
    technicianId: string;
    assignedBy:   string | null;
    statusId:     number;
    notes:        string | null;
  }): Promise<AssignmentEntity>;

  findById(id: string): Promise<AssignmentEntity | null>;
  findByTicket(ticketId: string): Promise<AssignmentEntity | null>;
  findByTechnician(filter: FindByTechnicianFilter): Promise<AssignmentEntity[]>;
  findAssignments(filter: FindAssignmentsFilter): Promise<{ assignments: AssignmentEntity[]; total: number }>;
  updateAssignment(
    id: string,
    data: Partial<Pick<AssignmentEntity, 'technicianId' | 'statusId' | 'notes' | 'closedAt'>>,
  ): Promise<AssignmentEntity>;

  // Status lookups
  findStatusByName(name: string): Promise<AssignmentStatusEntity | null>;
  findStatusById(id: number): Promise<AssignmentStatusEntity | null>;

  // Workload
  getWorkload(): Promise<TechnicianWorkloadEntity[]>;
  getTechnicianWorkload(technicianId: string): Promise<TechnicianWorkloadEntity | null>;
  upsertWorkload(technicianId: string, delta: number): Promise<void>;
}

export const ASSIGNMENT_REPOSITORY = Symbol('IAssignmentRepository');
