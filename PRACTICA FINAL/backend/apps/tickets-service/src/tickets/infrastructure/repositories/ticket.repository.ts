import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import {
  ITicketRepository,
  FindTicketsFilter,
  FindMyTicketsFilter,
  SearchFilter,
} from '../../application/interfaces/ticket-repository.interface';

import { TicketEntity }        from '../../domain/ticket.entity';
import { CommentEntity }       from '../../domain/comment.entity';
import { TicketHistoryEntity } from '../../domain/ticket-history.entity';
import { TicketStatusEntity }  from '../../domain/ticket-status.entity';
import { CategoryEntity }      from '../../domain/category.entity';
import { PriorityEntity }      from '../../domain/priority.entity';

@Injectable()
export class TicketRepository implements ITicketRepository {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketRepo: Repository<TicketEntity>,

    @InjectRepository(CommentEntity)
    private readonly commentRepo: Repository<CommentEntity>,

    @InjectRepository(TicketHistoryEntity)
    private readonly historyRepo: Repository<TicketHistoryEntity>,

    @InjectRepository(TicketStatusEntity)
    private readonly statusRepo: Repository<TicketStatusEntity>,

    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,

    @InjectRepository(PriorityEntity)
    private readonly priorityRepo: Repository<PriorityEntity>,

    private readonly dataSource: DataSource,
  ) {}

  // ── Tickets ──────────────────────────────────────────────────────────────

  async createTicket(data: {
    id: string; title: string; description: string;
    categoryId: number; priorityId: number; createdBy: string;
  }): Promise<TicketEntity> {
    const ticket = this.ticketRepo.create({
      id:          data.id,
      title:       data.title,
      description: data.description,
      categoryId:  data.categoryId,
      priorityId:  data.priorityId,
      statusId:    1,            // 'abierto' is always id=1 per seed
      createdBy:   data.createdBy,
    });
    await this.ticketRepo.save(ticket);
    return this.findByIdOrFail(data.id);
  }

  findById(id: string): Promise<TicketEntity | null> {
    return this.ticketRepo.findOne({
      where: { id },
      relations: ['category', 'priority', 'status'],
    });
  }

  private async findByIdOrFail(id: string): Promise<TicketEntity> {
    const ticket = await this.findById(id);
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  async findTickets(f: FindTicketsFilter): Promise<{ tickets: TicketEntity[]; total: number }> {
    const qb = this.ticketRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'category')
      .leftJoinAndSelect('t.priority', 'priority')
      .leftJoinAndSelect('t.status',   'status')
      .skip((f.page - 1) * f.limit)
      .take(f.limit)
      .orderBy('t.createdAt', 'DESC');

    if (f.status)     qb.andWhere('status.name = :status',         { status: f.status });
    if (f.priorityId) qb.andWhere('t.priorityId = :priorityId',   { priorityId: f.priorityId });
    if (f.categoryId) qb.andWhere('t.categoryId = :categoryId',   { categoryId: f.categoryId });
    if (f.assignedTo) qb.andWhere('t.assignedTo = :assignedTo',   { assignedTo: f.assignedTo });
    if (f.createdBy)  qb.andWhere('t.createdBy = :createdBy',     { createdBy: f.createdBy });
    if (f.from)       qb.andWhere('t.createdAt >= :from',         { from: f.from });
    if (f.to)         qb.andWhere('t.createdAt <= :to',           { to: f.to });

    const [tickets, total] = await qb.getManyAndCount();
    return { tickets, total };
  }

  async findMyTickets(f: FindMyTicketsFilter): Promise<{ tickets: TicketEntity[]; total: number }> {
    const qb = this.ticketRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'category')
      .leftJoinAndSelect('t.priority', 'priority')
      .leftJoinAndSelect('t.status',   'status')
      .where('t.createdBy = :userId', { userId: f.userId })
      .skip((f.page - 1) * f.limit)
      .take(f.limit)
      .orderBy('t.createdAt', 'DESC');

    if (f.status) qb.andWhere('status.name = :status', { status: f.status });

    const [tickets, total] = await qb.getManyAndCount();
    return { tickets, total };
  }

  async updateTicket(
    id: string,
    data: Partial<Pick<TicketEntity, 'description' | 'priorityId' | 'categoryId'>>,
  ): Promise<TicketEntity> {
    if (Object.keys(data).length > 0) {
      await this.ticketRepo.update({ id }, data);
    }
    return this.findByIdOrFail(id);
  }

  async updateStatus(
    id: string,
    statusId: number,
    extra?: Partial<Pick<TicketEntity, 'resolvedAt' | 'closedAt'>>,
  ): Promise<TicketEntity> {
    await this.ticketRepo.update({ id }, { statusId, ...extra });
    return this.findByIdOrFail(id);
  }

  async assignTicket(id: string, technicianId: string): Promise<TicketEntity> {
    await this.ticketRepo.update({ id }, { assignedTo: technicianId });
    return this.findByIdOrFail(id);
  }

  async searchTickets(f: SearchFilter): Promise<{ tickets: TicketEntity[]; total: number }> {
    const qb = this.ticketRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'category')
      .leftJoinAndSelect('t.priority', 'priority')
      .leftJoinAndSelect('t.status',   'status')
      // MySQL FULLTEXT search on idx_ticket_search (title, description)
      .where('MATCH(t.title, t.description) AGAINST (:query IN BOOLEAN MODE)', { query: f.query + '*' })
      .skip((f.page - 1) * f.limit)
      .take(f.limit)
      .orderBy('t.createdAt', 'DESC');

    if (f.status)     qb.andWhere('status.name = :status',         { status: f.status });
    if (f.priorityId) qb.andWhere('t.priorityId = :priorityId',   { priorityId: f.priorityId });
    if (f.categoryId) qb.andWhere('t.categoryId = :categoryId',   { categoryId: f.categoryId });

    const [tickets, total] = await qb.getManyAndCount();
    return { tickets, total };
  }

  async findStaleResolved(olderThanDays: number): Promise<TicketEntity[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    return this.ticketRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.status', 'status')
      .where('status.name = :status', { status: 'resuelto' })
      .andWhere('t.updatedAt < :cutoff', { cutoff })
      .getMany();
  }

  // ── Lookups ──────────────────────────────────────────────────────────────

  findStatusByName(name: string): Promise<TicketStatusEntity | null> {
    return this.statusRepo.findOne({ where: { name } });
  }

  findStatusById(id: number): Promise<TicketStatusEntity | null> {
    return this.statusRepo.findOne({ where: { id } });
  }

  findCategoryById(id: number): Promise<CategoryEntity | null> {
    return this.categoryRepo.findOne({ where: { id } });
  }

  findPriorityById(id: number): Promise<PriorityEntity | null> {
    return this.priorityRepo.findOne({ where: { id } });
  }

  // ── History ──────────────────────────────────────────────────────────────

  async addHistory(data: {
    id: string; ticketId: string; changedBy: string;
    fieldChanged: string; oldValue: string | null; newValue: string | null;
  }): Promise<TicketHistoryEntity> {
    const entry = this.historyRepo.create(data);
    return this.historyRepo.save(entry);
  }

  findHistory(ticketId: string): Promise<TicketHistoryEntity[]> {
    return this.historyRepo.find({
      where: { ticketId },
      order: { changedAt: 'ASC' },
    });
  }

  // ── Comments ─────────────────────────────────────────────────────────────

  async addComment(data: {
    id: string; ticketId: string; authorId: string;
    content: string; isInternal: boolean;
  }): Promise<CommentEntity> {
    const comment = this.commentRepo.create(data);
    return this.commentRepo.save(comment);
  }

  findComments(ticketId: string, includeInternal: boolean): Promise<CommentEntity[]> {
    const qb = this.commentRepo
      .createQueryBuilder('c')
      .where('c.ticketId = :ticketId', { ticketId })
      .orderBy('c.createdAt', 'ASC');

    if (!includeInternal) {
      qb.andWhere('c.isInternal = :internal', { internal: false });
    }

    return qb.getMany();
  }
}
