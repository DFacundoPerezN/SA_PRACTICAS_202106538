import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';

import {
  IAssignmentRepository,
  FindAssignmentsFilter,
  FindByTechnicianFilter,
} from '../../application/interfaces/assignment-repository.interface';

import { AssignmentEntity }        from '../../domain/assignment.entity';
import { AssignmentStatusEntity }  from '../../domain/assignment-status.entity';
import { TechnicianWorkloadEntity } from '../../domain/technician-workload.entity';

@Injectable()
export class AssignmentRepository implements IAssignmentRepository {
  constructor(
    @InjectRepository(AssignmentEntity)
    private readonly assignmentRepo: Repository<AssignmentEntity>,

    @InjectRepository(AssignmentStatusEntity)
    private readonly statusRepo: Repository<AssignmentStatusEntity>,

    @InjectRepository(TechnicianWorkloadEntity)
    private readonly workloadRepo: Repository<TechnicianWorkloadEntity>,
  ) {}

  // ── Assignments ───────────────────────────────────────────────────────────

  async createAssignment(data: {
    id: string; ticketId: string; technicianId: string;
    assignedBy: string | null; statusId: number; notes: string | null;
  }): Promise<AssignmentEntity> {
    const entity = this.assignmentRepo.create(data);
    await this.assignmentRepo.save(entity);
    return this.findByIdOrFail(data.id);
  }

  findById(id: string): Promise<AssignmentEntity | null> {
    return this.assignmentRepo.findOne({
      where: { id },
      relations: ['status'],
    });
  }

  private async findByIdOrFail(id: string): Promise<AssignmentEntity> {
    const a = await this.findById(id);
    if (!a) throw new NotFoundException(`Assignment ${id} not found`);
    return a;
  }

  findByTicket(ticketId: string): Promise<AssignmentEntity | null> {
    return this.assignmentRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.status', 'status')
      .where('a.ticketId = :ticketId', { ticketId })
      .andWhere('status.name IN (:...activeStatuses)', {
        activeStatuses: ['asignado', 'reasignado'],
      })
      .orderBy('a.assignedAt', 'DESC')
      .getOne();
  }

  async findByTechnician(filter: FindByTechnicianFilter): Promise<AssignmentEntity[]> {
    const qb = this.assignmentRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.status', 'status')
      .where('a.technicianId = :technicianId', { technicianId: filter.technicianId })
      .orderBy('a.assignedAt', 'DESC');

    if (filter.status) {
      qb.andWhere('status.name = :status', { status: filter.status });
    }

    return qb.getMany();
  }

  async findAssignments(f: FindAssignmentsFilter): Promise<{ assignments: AssignmentEntity[]; total: number }> {
    const qb = this.assignmentRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.status', 'status')
      .skip((f.page - 1) * f.limit)
      .take(f.limit)
      .orderBy('a.assignedAt', 'DESC');

    if (f.status)       qb.andWhere('status.name = :status',                 { status: f.status });
    if (f.technicianId) qb.andWhere('a.technicianId = :technicianId',        { technicianId: f.technicianId });
    if (f.ticketId)     qb.andWhere('a.ticketId = :ticketId',                { ticketId: f.ticketId });
    if (f.from)         qb.andWhere('a.assignedAt >= :from',                 { from: f.from });
    if (f.to)           qb.andWhere('a.assignedAt <= :to',                   { to: f.to });

    const [assignments, total] = await qb.getManyAndCount();
    return { assignments, total };
  }

  async updateAssignment(
    id: string,
    data: Partial<Pick<AssignmentEntity, 'technicianId' | 'statusId' | 'notes' | 'closedAt'>>,
  ): Promise<AssignmentEntity> {
    if (Object.keys(data).length > 0) {
      await this.assignmentRepo.update({ id }, data);
    }
    return this.findByIdOrFail(id);
  }

  // ── Status lookups ────────────────────────────────────────────────────────

  findStatusByName(name: string): Promise<AssignmentStatusEntity | null> {
    return this.statusRepo.findOne({ where: { name } });
  }

  findStatusById(id: number): Promise<AssignmentStatusEntity | null> {
    return this.statusRepo.findOne({ where: { id } });
  }

  // ── Workload ──────────────────────────────────────────────────────────────

  getWorkload(): Promise<TechnicianWorkloadEntity[]> {
    return this.workloadRepo.find({ order: { activeTickets: 'ASC' } });
  }

  getTechnicianWorkload(technicianId: string): Promise<TechnicianWorkloadEntity | null> {
    return this.workloadRepo.findOne({ where: { technicianId } });
  }

  /**
   * Upsert workload row for a technician and adjust activeTickets by delta (+1 or -1).
   * Clamps to 0 — never goes negative.
   */
  async upsertWorkload(technicianId: string, delta: number): Promise<void> {
    const existing = await this.workloadRepo.findOne({ where: { technicianId } });

    if (existing) {
      const next = Math.max(0, existing.activeTickets + delta);
      await this.workloadRepo.update({ technicianId }, { activeTickets: next });
    } else {
      // First time we see this technician — create the row
      const entity = this.workloadRepo.create({
        technicianId,
        activeTickets: Math.max(0, delta),
      });
      await this.workloadRepo.save(entity);
    }
  }
}
