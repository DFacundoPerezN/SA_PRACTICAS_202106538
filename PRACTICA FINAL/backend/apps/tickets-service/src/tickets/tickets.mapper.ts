import { TicketEntity }        from './domain/ticket.entity';
import { CommentEntity }       from './domain/comment.entity';
import { TicketHistoryEntity } from './domain/ticket-history.entity';

export function toTicketResponse(t: TicketEntity) {
  return {
    id:          t.id,
    title:       t.title,
    description: t.description,
    category:    t.category?.name  ?? '',
    priority:    t.priority?.name  ?? '',
    status:      t.status?.name    ?? '',
    createdBy:   t.createdBy,
    assignedTo:  t.assignedTo      ?? '',
    resolvedAt:  t.resolvedAt?.toISOString() ?? '',
    closedAt:    t.closedAt?.toISOString()   ?? '',
    createdAt:   t.createdAt?.toISOString()  ?? '',
    updatedAt:   t.updatedAt?.toISOString()  ?? '',
  };
}

export function toHistoryEntry(h: TicketHistoryEntity) {
  return {
    id:           h.id,
    fieldChanged: h.fieldChanged,
    oldValue:     h.oldValue  ?? '',
    newValue:     h.newValue  ?? '',
    changedBy:    h.changedBy,
    changedAt:    h.changedAt?.toISOString() ?? '',
  };
}

export function toCommentResponse(c: CommentEntity) {
  return {
    id:         c.id,
    ticketId:   c.ticketId,
    authorId:   c.authorId,
    content:    c.content,
    isInternal: c.isInternal,
    createdAt:  c.createdAt?.toISOString() ?? '',
  };
}
