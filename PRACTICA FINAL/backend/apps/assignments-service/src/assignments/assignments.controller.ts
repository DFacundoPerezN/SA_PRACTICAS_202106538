import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AssignmentsService } from './application/assignments.service';
import { toAssignmentResponse, toWorkloadEntry } from './assignments.mapper';

@Controller()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  // ── RF-11: manual assign ──────────────────────────────────────────────────
  @GrpcMethod('AssignmentsService', 'ManualAssign')
  async manualAssign(data: {
    ticketId: string; technicianId: string; assignedBy: string; notes?: string;
  }) {
    const assignment = await this.assignmentsService.manualAssign({
      ticketId:     data.ticketId,
      technicianId: data.technicianId,
      assignedBy:   data.assignedBy,
      notes:        data.notes,
    });
    return toAssignmentResponse(assignment);
  }

  // ── List with filters ────────────────────────────────────────────────────
  @GrpcMethod('AssignmentsService', 'FindAssignments')
  async findAssignments(data: {
    status?: string; technicianId?: string; ticketId?: string;
    from?: string; to?: string; page?: number; limit?: number;
  }) {
    const { assignments, total } = await this.assignmentsService.findAssignments({
      status:       data.status       || undefined,
      technicianId: data.technicianId || undefined,
      ticketId:     data.ticketId     || undefined,
      from:         data.from         || undefined,
      to:           data.to           || undefined,
      page:         data.page         || 1,
      limit:        data.limit        || 20,
    });
    return { assignments: assignments.map(toAssignmentResponse), total };
  }

  // ── Active assignment for a ticket ───────────────────────────────────────
  @GrpcMethod('AssignmentsService', 'FindByTicket')
  async findByTicket(data: { ticketId: string }) {
    const assignment = await this.assignmentsService.findByTicket(data.ticketId);
    return toAssignmentResponse(assignment);
  }

  // ── Assignments of a technician ──────────────────────────────────────────
  @GrpcMethod('AssignmentsService', 'FindByTechnician')
  async findByTechnician(data: { technicianId: string; status?: string }) {
    const assignments = await this.assignmentsService.findByTechnician({
      technicianId: data.technicianId,
      status:       data.status || undefined,
    });
    return { assignments: assignments.map(toAssignmentResponse), total: assignments.length };
  }

  // ── RF-22: workload ──────────────────────────────────────────────────────
  @GrpcMethod('AssignmentsService', 'GetWorkload')
  async getWorkload(_: Record<string, never>) {
    const workload = await this.assignmentsService.getWorkload();
    return { workload: workload.map(toWorkloadEntry) };
  }

  // ── Reassign / close ─────────────────────────────────────────────────────
  @GrpcMethod('AssignmentsService', 'UpdateAssignment')
  async updateAssignment(data: {
    id: string; technicianId?: string; status?: string;
    notes?: string; updatedBy: string;
  }) {
    const assignment = await this.assignmentsService.updateAssignment({
      id:            data.id,
      technicianId:  data.technicianId || undefined,
      status:        data.status       || undefined,
      notes:         data.notes        || undefined,
      updatedBy:     data.updatedBy,
    });
    return toAssignmentResponse(assignment);
  }
}
