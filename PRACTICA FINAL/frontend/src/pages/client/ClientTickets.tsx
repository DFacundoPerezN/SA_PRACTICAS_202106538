import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTickets } from '../../services/ticketService';
import type { TicketListItem, TicketStatus, TicketPriority } from '../../types/ticket.types';

// ─── Helpers visuales ─────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TicketStatus, string> = {
  abierto:     'bg-blue-100 text-blue-700 border border-blue-200',
  en_progreso: 'bg-amber-100 text-amber-700 border border-amber-200',
  resuelto:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  cerrado:     'bg-slate-100 text-slate-500 border border-slate-200',
  reabierto:   'bg-purple-100 text-purple-700 border border-purple-200',
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  abierto:     'Abierto',
  en_progreso: 'En progreso',
  resuelto:    'Resuelto',
  cerrado:     'Cerrado',
  reabierto:   'Reabierto',
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  baja:    'bg-slate-100 text-slate-500',
  media:   'bg-blue-100 text-blue-600',
  alta:    'bg-orange-100 text-orange-600',
  critica: 'bg-red-100 text-red-600 font-semibold',
};

const PRIORITY_DOT: Record<TicketPriority, string> = {
  baja:    'bg-slate-400',
  media:   'bg-blue-500',
  alta:    'bg-orange-500',
  critica: 'bg-red-500',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const TicketSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
      <div className="h-6 w-20 bg-slate-100 rounded-full" />
    </div>
    <div className="mt-4 flex gap-2">
      <div className="h-5 w-16 bg-slate-100 rounded-full" />
      <div className="h-5 w-24 bg-slate-100 rounded-full" />
    </div>
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────

const ClientTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtro de estado en el cliente (sin paginación extra por ahora)
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'todos'>('todos');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyTickets();
        setTickets(data.tickets);
        setTotal(data.total);
      } catch (err: any) {
        setError(err.message || 'Error al cargar los tickets');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered =
    filterStatus === 'todos'
      ? tickets
      : tickets.filter((t) => t.status === filterStatus);

  const statuses: Array<TicketStatus | 'todos'> = [
    'todos',
    'abierto',
    'en_progreso',
    'resuelto',
    'cerrado',
    'reabierto',
  ];

  return (
    <div className="space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis Tickets</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? 'Cargando…' : `${total} ticket${total !== 1 ? 's' : ''} en total`}
          </p>
        </div>
        <button
          onClick={() => navigate('/client/tickets/new')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-200"
        >
          {/* Plus icon */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo ticket
        </button>
      </div>

      {/* ── Filtros de estado ── */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              filterStatus === s
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800'
            }`}
          >
            {s === 'todos' ? 'Todos' : STATUS_LABEL[s as TicketStatus]}
          </button>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Lista ── */}
      <div className="space-y-3">
        {loading ? (
          <>
            <TicketSkeleton />
            <TicketSkeleton />
            <TicketSkeleton />
          </>
        ) : filtered.length === 0 ? (
          /* Estado vacío */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No tienes tickets</p>
            <p className="text-slate-400 text-sm mt-1">
              {filterStatus === 'todos'
                ? 'Crea tu primer ticket para recibir soporte.'
                : `No hay tickets con estado "${STATUS_LABEL[filterStatus as TicketStatus]}".`}
            </p>
            {filterStatus === 'todos' && (
              <button
                onClick={() => navigate('/client/tickets/new')}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2"
              >
                Crear un ticket
              </button>
            )}
          </div>
        ) : (
          filtered.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => navigate(`/client/tickets/${ticket.id}`)}
              className="w-full text-left bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-50 rounded-xl p-5 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Título y categoría */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                    {ticket.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{ticket.category}</p>
                </div>
                {/* Badge de estado */}
                <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[ticket.status]}`}>
                  {STATUS_LABEL[ticket.status]}
                </span>
              </div>

              {/* Fila inferior */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                {/* Prioridad */}
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${PRIORITY_STYLES[ticket.priority]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[ticket.priority]}`} />
                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </span>
                {/* Fecha */}
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(ticket.created_at)}
                </span>
                {/* Flecha */}
                <svg
                  className="w-4 h-4 ml-auto text-slate-300 group-hover:text-blue-400 transition-colors"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientTickets;
