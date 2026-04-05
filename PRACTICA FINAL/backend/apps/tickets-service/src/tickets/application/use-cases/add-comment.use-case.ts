import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TICKET_REPOSITORY } from '../interfaces/ticket-repository.interface';
import type { ITicketRepository } from '../interfaces/ticket-repository.interface';
import { CommentEntity } from '../../domain/comment.entity';

export interface AddCommentInput {
  ticketId:   string;
  authorId:   string;
  content:    string;
  isInternal: boolean;
}

@Injectable()
export class AddCommentUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly ticketRepo: ITicketRepository,
  ) {}

  async execute(input: AddCommentInput): Promise<CommentEntity> {
    const ticket = await this.ticketRepo.findById(input.ticketId);
    if (!ticket) throw new NotFoundException(`Ticket ${input.ticketId} not found`);

    return this.ticketRepo.addComment({
      id:         randomUUID(),
      ticketId:   input.ticketId,
      authorId:   input.authorId,
      content:    input.content,
      isInternal: input.isInternal,
    });
  }
}
