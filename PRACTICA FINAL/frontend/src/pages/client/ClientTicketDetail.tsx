import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getTicketById,
  getComments,
  addComment,
} from "../../services/ticketService";
import { getUser } from "../../utils/authStorage";
import type {
  Ticket,
  Comment,
  TicketStatus,
  TicketPriority,
} from "../../types/ticket.types";

// ─── Helpers visuales ─────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TicketStatus, string> = {
  abierto: "bg-blue-100 text-blue-700 border border-blue-200",
  en_progreso: "bg-amber-100 text-amber-700 border border-amber-200",
  resuelto: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  cerrado: "bg-slate-100 text-slate-500 border border-slate-200",
  reabierto: "bg-purple-100 text-purple-700 border border-purple-200",
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  abierto: "Abierto",
  en_progreso: "En progreso",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
  reabierto: "Reabierto",
};

const PRIORITY_STYLES: Record<TicketPriority, { badge: string; dot: string }> =
  {
    baja: { badge: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
    media: { badge: "bg-blue-100 text-blue-600", dot: "bg-blue-500" },
    alta: { badge: "bg-orange-100 text-orange-600", dot: "bg-orange-500" },
    critica: { badge: "bg-red-100 text-red-600", dot: "bg-red-500" },
  };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 border-b border-slate-100 last:border-0">
    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide sm:w-32 flex-shrink-0">
      {label}
    </span>
    <span className="text-sm text-slate-700">{children}</span>
  </div>
);

const CommentBubble = ({
  comment,
  isOwn,
}: {
  comment: Comment;
  isOwn: boolean;
}) => {
  // Función para procesar el contenido y mantener el formato
  const renderContent = (content: string) => {
    // Dividir el contenido por saltos de línea
    const lines = content.split("\n");

    return lines.map((line, index) => {
      // Detectar si la línea es un título (comienza con **)
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <div key={index} className="font-bold mb-2 mt-1">
            {line.replace(/\*\*/g, "")}
          </div>
        );
      }
      // Detectar si la línea es un paso numerado (ej: "1. ", "2. ")
      else if (/^\d+\./.test(line)) {
        return (
          <div key={index} className="ml-2 mb-1">
            {line}
          </div>
        );
      }
      // Detectar si la línea es un ítem de lista (comienza con -)
      else if (line.startsWith("-")) {
        return (
          <div key={index} className="ml-4 mb-1 flex items-start gap-2">
            <span className="text-current">•</span>
            <span className="flex-1">{line.substring(1).trim()}</span>
          </div>
        );
      }
      // Línea vacía
      else if (line.trim() === "") {
        return <div key={index} className="h-2" />;
      }
      // Texto normal
      else {
        // Procesar texto con **negritas** inline
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const processedParts = parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        return (
          <div key={index} className="mb-1">
            {processedParts}
          </div>
        );
      }
    });
  };

  return (
    <div
      className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
    >
      {comment.isInternal && (
        <span className="text-xs text-amber-600 flex items-center gap-1 px-1">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Nota interna
        </span>
      )}

      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm
          ${
            isOwn
              ? comment.isInternal
                ? "bg-amber-500 text-white rounded-tr-sm"
                : "bg-blue-600 text-white rounded-tr-sm"
              : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
          }`}
      >
        <div className="space-y-0.5 leading-relaxed">
          {renderContent(comment.content)}
        </div>
      </div>

      <span className="text-xs text-slate-400 px-1">
        {formatDateTime(comment.createdAt)}
      </span>
    </div>
  );
};

// Skeletons
const TicketDetailSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-7 bg-slate-200 rounded w-2/3" />
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 bg-slate-100 rounded w-24" />
          <div className="h-4 bg-slate-200 rounded w-40" />
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl border border-slate-200 p-6 h-40" />
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────

const ClientTicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [ticketError, setTicketError] = useState<string | null>(null);

  // Comentario nuevo
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Carga del ticket
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoadingTicket(true);
      try {
        const data = await getTicketById(id);
        setTicket(data.ticket as Ticket);
      } catch (err: any) {
        setTicketError(err.message || "No se pudo cargar el ticket");
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
        const data = await getComments(id);
        setComments(data.comments);
      } catch {
        // No es bloqueante; los comentarios son opcionales
      } finally {
        setLoadingComments(false);
      }
    };
    load();
  }, [id]);

  // Scroll al último comentario al cargar
  useEffect(() => {
    if (!loadingComments)
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loadingComments, comments.length]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;

    setSendingComment(true);
    setCommentError(null);

    try {
      const created = await addComment(id, {
        content: newComment.trim(),
        is_internal: false,
      });
      setComments((prev: Comment[]) => [
        ...prev,
        created as unknown as Comment,
      ]);
      setNewComment("");
    } catch (err: any) {
      setCommentError(err.message || "Error al enviar el comentario");
    } finally {
      setSendingComment(false);
    }
  };

  // ── Render ──

  if (loadingTicket) return <TicketDetailSkeleton />;

  if (ticketError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-7 h-7 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-slate-700 font-medium">{ticketError}</p>
        <button
          onClick={() => navigate("/client/tickets")}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Volver a mis tickets
        </button>
      </div>
    );
  }

  if (!ticket) return null;

  const isTicketOpen = !["cerrado", "resuelto"].includes(ticket.status);
  const priorityStyle = PRIORITY_STYLES[ticket.priority];

  const getShortId = (id: string) => {
    return id?.slice(0, 8).toUpperCase() || id;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate("/client/tickets")}
          className="mt-1 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
          aria-label="Volver"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[ticket.status]}`}
            >
              {STATUS_LABEL[ticket.status]}
            </span>
            <span className="text-xs text-slate-400">
              #{getShortId(ticket.id)}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 leading-snug">
            {ticket.title}
          </h1>
        </div>
      </div>

      {/* ── Información del ticket ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-600">
            Detalles del ticket
          </h2>
        </div>
        <div className="px-5 divide-y divide-slate-100">
          <DetailRow label="Descripción">
            <span className="whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </span>
          </DetailRow>
          <DetailRow label="Categoría">{ticket.category}</DetailRow>
          <DetailRow label="Prioridad">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${priorityStyle.badge}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`}
              />
              {ticket.priority.charAt(0).toUpperCase() +
                ticket.priority.slice(1)}
            </span>
          </DetailRow>
          <DetailRow label="Asignado a">
            {ticket.assignedTo ? (
              <span className="font-medium text-slate-700">
                {ticket.assignedTo}
              </span>
            ) : (
              <span className="text-slate-400 italic">Sin asignar</span>
            )}
          </DetailRow>
          <DetailRow label="Creado">{formatDate(ticket.createdAt)}</DetailRow>
          <DetailRow label="Última actualización">
            {formatDateTime(ticket.updatedAt)}
          </DetailRow>
        </div>
      </div>

      {/* ── Comentarios ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-600">Comentarios</h2>
          <span className="text-xs text-slate-400">
            {comments.length} mensaje{comments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Lista de comentarios */}
        <div className="px-5 py-4 space-y-4 min-h-[120px] max-h-[400px] overflow-y-auto">
          {loadingComments ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg
                className="w-8 h-8 text-slate-300 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-sm text-slate-400">Aún no hay comentarios.</p>
              {isTicketOpen && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Puedes escribir uno abajo.
                </p>
              )}
            </div>
          ) : (
            comments.map((c) => (
              <CommentBubble
                key={c.id}
                comment={c}
                isOwn={c.authorId === user?.sub}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input de nuevo comentario */}
        {isTicketOpen ? (
          <div className="border-t border-slate-100 px-5 py-4">
            <form onSubmit={handleSendComment} className="flex flex-col gap-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment(e as any);
                  }
                }}
                rows={3}
                placeholder="Escribe un comentario… (Enter para enviar, Shift+Enter para salto de línea)"
                disabled={sendingComment}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm outline-none resize-none transition-colors disabled:bg-slate-50"
              />

              {commentError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {commentError}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || sendingComment}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
                >
                  {sendingComment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Enviar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Ticket cerrado/resuelto: no se pueden agregar comentarios */
          <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
            <p className="text-xs text-slate-400 text-center">
              Este ticket está {STATUS_LABEL[ticket.status].toLowerCase()} y no
              admite nuevos comentarios.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientTicketDetail;
