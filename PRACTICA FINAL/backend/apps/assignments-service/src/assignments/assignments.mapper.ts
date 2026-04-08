import { AssignmentEntity }        from './domain/assignment.entity';
import { TechnicianWorkloadEntity } from './domain/technician-workload.entity';

export function toAssignmentResponse(a: AssignmentEntity) {
  return {
    id:           a.id,
    ticketId:     a.ticketId,
    technicianId: a.technicianId,
    assignedBy:   a.assignedBy   ?? '',
    status:       a.status?.name ?? '',
    notes:        a.notes        ?? '',
    assignedAt:   a.assignedAt?.toISOString() ?? '',
    closedAt:     a.closedAt?.toISOString()   ?? '',
  };
}

export function toWorkloadEntry(w: TechnicianWorkloadEntity) {
  return {
    technicianId:  w.technicianId,
    activeTickets: w.activeTickets,
    lastUpdated:   w.lastUpdated?.toISOString() ?? '',
  };
}
