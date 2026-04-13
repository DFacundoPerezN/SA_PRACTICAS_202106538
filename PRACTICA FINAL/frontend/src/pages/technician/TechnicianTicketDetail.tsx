import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getTechnicianTicketById,
  getTechnicianComments,
  addTechnicianComment,
  updateTicketStatus,
  getTicketAssignment,
} from '../../services/technicianService';
import { getUser } from '../../utils/authStorage';
import type { Ticket, Comment, TicketStatus, TicketPriority } from '../../types/ticket.types';
import type { TicketAssignmentResponse } from '../../types/technician.types';

// ─── Catálogos ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TicketStatus, { label: string; badge: string; dot: string }> = {
  abierto:     { label: 'Abierto',     badge: 'bg-blue-100 text-blue-700 border border-blue-200',         dot: 'bg-blue-500' },
  en_progreso: { label: 'En progreso', badge: 'bg-amber-100 text-amber-700 border border-amber-200',      dot: 'bg-amber-500' },
  resuelto:    { label: 'Resuelto',    badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  cerrado:     { label: 'Cerrado',     badge: 'bg-slate-100 text-slate-500 border border-slate-200',      dot: 'bg-slate-400' },
  reabierto:   { label: 'Reabierto',   badge: 'bg-purple-100 text-purple-700 border border-purple-200',   dot: 'bg-purple-500' },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; badge: string; dot: string }> = {
  baja:    { label: 'Baja',    badge: 'bg-slate-100 text-slate-500',   dot: 'bg-slate-400' },
  media:   { label: 'Media',   badge: 'bg-blue-100 text-blue-600',     dot: 'bg-blue-500' },
  alta:    { label: 'Alta',    badge: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' },
  critica: { label: 'Crítica', badge: 'bg-red-100 text-red-600 font-semibold', dot: 'bg-red-500' },
};

// Transiciones de estado permitidas
const NEXT_STATUSES: Partial<Record<TicketStatus, Array<{ value: string; label: string; color: string }>>> = {
  abierto:     [{ value: 'en_progreso', label: 'Iniciar progreso', color: 'bg-amber-500 hover:bg-amber-600' }],
  en_progreso: [{ value: 'resuelto', label: 'Marcar como resuelto', color: 'bg-emerald-600 hover:bg-emerald-700' }],
  resuelto:    [
    { value: 'cerrado',   label: 'Cerrar ticket',  color: 'bg-slate-600 hover:bg-slate-700' },
    { value: 'reabierto', label: 'Reabrir ticket', color: 'bg-purple-600 hover:bg-purple-700' },
  ],
  cerrado:     [{ value: 'reabierto', label: 'Reabrir ticket', color: 'bg-purple-600 hover:bg-purple-700' }],
  reabierto:   [{ value: 'en_progreso', label: 'Iniciar progreso', color: 'bg-amber-500 hover:bg-amber-600' }],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-slate-100 last:border-0">
    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide sm:w-36 flex-shrink-0 pt-0.5">
      {label}
    </span>
    <span className="text-sm text-slate-700">{children}</span>
  </div>
);

const CommentBubble = ({
  comment, isOwn,
}: {
  comment: Comment;
  isOwn: boolean;
}) => (
  <div className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
    {comment.is_internal && (
      <span className="text-xs text-amber-600 flex items-center gap-1 px-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Nota interna
      </span>
    )}
    <div
      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
        ${isOwn
          ? comment.is_internal
            ? 'bg-amber-500 text-white rounded-tr-sm'
            : 'bg-blue-600 text-white rounded-tr-sm'
          : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
        }`}
    >
      {comment.content}
    </div>
    <span className="text-xs text-slate-400 px-1">{formatDateTime(comment.createdAt)}</span>
  </div>
);

const DetailSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex gap-3 items-center">
      <div className="w-8 h-8 bg-slate-200 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="h-6 bg-slate-200 rounded w-2/3" />
        <div className="h-4 bg-slate-100 rounded w-1/4" />
      </div>
    </div>
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 bg-slate-100 rounded w-28" />
          <div className="h-4 bg-slate-200 rounded w-40" />
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl border border-slate-200 p-6 h-48" />
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────

const TechnicianTicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket]       = useState<Ticket | null>(null);
  const [comments, setComments]   = useState<Comment[]>([]);
  const [assignment, setAssignment] = useState<TicketAssignmentResponse | null>(null);

  const [loadingTicket, setLoadingTicket]     = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [ticketError, setTicketError]         = useState<string | null>(null);

  // Cambio de estado
  const [changingStatus, setChangingStatus]   = useState(false);
  const [statusError, setStatusError]         = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess]     = useState<string | null>(null);

  // Comentario nuevo
  const [newComment, setNewComment]           = useState('');
  const [isInternal, setIsInternal]           = useState(false);
  const [sendingComment, setSendingComment]   = useState(false);
  const [commentError, setCommentError]       = useState<string | null>(null);

  // Carga del ticket
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoadingTicket(true);
      try {
        const [ticketData, assignmentData] = await Promise.all([
          getTechnicianTicketById(id),
          getTicketAssignment(id),
        ]);
        setTicket(ticketData);
        setAssignment(assignmentData);
      } catch (err: any) {
        setTicketError(err.message || 'No se pudo cargar el ticket');
      } finally {
        setLoadingTicket(false);
      }
    };
    load();
  }, [id]);

  // Carga de comentarios
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoadingComments(true);
      try {
        const data = await getTechnicianComments(id);
        setComments(data.comments);
      } catch {
        // No bloqueante
      } finally {
        setLoadingComments(false);
      }
    };
    load();
  }, [id]);

  // Scroll al último comentario
  useEffect(() => {
    if (!loadingComments) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [loadingComments, comments.length]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !ticket) return;
    setChangingStatus(true);
    setStatusError(null);
    setStatusSuccess(null);
    try {
      const updated = await updateTicketStatus(id, {
        status: newStatus as 'en_progreso' | 'resuelto' | 'cerrado' | 'reabierto',
      });
      setTicket((prev) => prev ? { ...prev, status: updated.status, updated_at: updated.updated_at } : prev);
      setStatusSuccess(`Estado actualizado a "${STATUS_CONFIG[updated.status].label}"`);
      setTimeout(() => setStatusSuccess(null), 3000);
    } catch (err: any) {
      setStatusError(err.message || 'Error al cambiar el estado');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;
    setSendingComment(true);
    setCommentError(null);
    try {
      const created = await addTechnicianComment(id, {
        content: newComment.trim(),
        is_internal: isInternal,
      });
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } catch (err: any) {
      setCommentError(err.message || 'Error al enviar el comentario');
    } finally {
      setSendingComment(false);
    }
  };

  // ── Render ──

  if (loadingTicket) return <DetailSkeleton />;

  if (ticketError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-700 font-medium">{ticketError}</p>
        <button onClick={() => navigate('/tecnico/tickets')} className="text-sm text-blue-600 hover:underline">
          ← Volver a tickets
        </button>
      </div>
    );
  }

  if (!ticket) return null;

  const statusCfg   = STATUS_CONFIG[ticket.status];
  const priorityCfg = PRIORITY_CONFIG[ticket.priority];
  const nextStatuses = NEXT_STATUSES[ticket.status] ?? [];
  const isTicketActive = !['cerrado'].includes(ticket.status);

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── Encabezado ── */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/tecnico/tickets')}
          className="mt-1 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
          aria-label="Volver"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${statusCfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            <span className="text-xs text-slate-400 font-mono">#{ticket.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 leading-snug">{ticket.title}</h1>
        </div>
      </div>

      {/* ── Acciones de estado ── */}
      {nextStatuses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Cambiar estado del ticket
          </p>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((ns) => (
              <button
                key={ns.value}
                onClick={() => handleStatusChange(ns.value)}
                disabled={changingStatus}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg
                            transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm ${ns.color}`}
              >
                {changingStatus ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {ns.label}
              </button>
            ))}
          </div>

          {statusError && (
            <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {statusError}
            </p>
          )}
          {statusSuccess && (
            <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {statusSuccess}
            </p>
          )}
        </div>
      )}

      {/* ── Información del ticket ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-600">Detalles del ticket</h2>
          <span className="text-xs text-slate-400">{formatDate(ticket.createdAt)}</span>
        </div>
        <div className="px-5 divide-y divide-slate-100">
          <DetailRow label="Descripción">
            <span className="whitespace-pre-wrap leading-relaxed">{ticket.description}</span>
          </DetailRow>
          <DetailRow label="Categoría">{ticket.category}</DetailRow>
          <DetailRow label="Prioridad">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${priorityCfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
              {priorityCfg.label}
            </span>
          </DetailRow>
          <DetailRow label="Creado por">
            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{ticket.created_by.slice(0, 8)}…</span>
          </DetailRow>
          <DetailRow label="Asignado a">
            {assignment ? (
              <div className="space-y-1">
                <span className="font-mono text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                  {assignment.technician_id.slice(0, 8)}…
                </span>
                <p className="text-xs text-slate-400">Asignado el {formatDate(assignment.assigned_at)}</p>
              </div>
            ) : ticket.assigned_to ? (
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{ticket.assigned_to.slice(0, 8)}…</span>
            ) : (
              <span className="text-slate-400 italic">Sin asignar</span>
            )}
          </DetailRow>
          <DetailRow label="Última actualización">{formatDateTime(ticket.updatedAt)}</DetailRow>
        </div>
      </div>

      {/* ── Comentarios ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-600">Comentarios</h2>
          <span className="text-xs text-slate-400">{comments.length} mensaje{comments.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Lista */}
        <div className="px-5 py-4 space-y-4 min-h-[140px] max-h-[420px] overflow-y-auto">
          {loadingComments ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-slate-400">Aún no hay comentarios.</p>
            </div>
          ) : (
            comments.map((c) => (
              <CommentBubble key={c.id} comment={c} isOwn={c.author_id === user?.sub} />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input de comentario */}
        {isTicketActive ? (
          <div className="border-t border-slate-100 px-5 py-4 space-y-3">
            {/* Toggle nota interna */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsInternal((prev) => !prev)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out
                            focus:outline-none ${isInternal ? 'bg-amber-500' : 'bg-slate-200'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5
                              ${isInternal ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </button>
              <span className={`text-xs font-medium ${isInternal ? 'text-amber-600' : 'text-slate-500'}`}>
                {isInternal ? 'Nota interna (solo técnicos)' : 'Comentario público'}
              </span>
            </div>

            <form onSubmit={handleSendComment} className="flex flex-col gap-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment(e as any);
                  }
                }}
                rows={3}
                placeholder={isInternal
                  ? 'Escribe una nota interna… (solo visible para técnicos)'
                  : 'Escribe un comentario… (visible para el cliente)'}
                disabled={sendingComment}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none resize-none transition-colors disabled:bg-slate-50
                            ${isInternal
                              ? 'border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 bg-amber-50/50'
                              : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
              />

              {commentError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {commentError}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || sendingComment}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg
                              transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm
                              ${isInternal
                                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                >
                  {sendingComment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      {isInternal ? 'Agregar nota' : 'Enviar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
            <p className="text-xs text-slate-400 text-center">
              Este ticket está cerrado y no admite nuevos comentarios.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianTicketDetail;
