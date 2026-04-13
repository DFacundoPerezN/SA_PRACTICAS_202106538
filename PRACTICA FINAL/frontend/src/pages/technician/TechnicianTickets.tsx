import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTechnicianTickets, searchTickets } from '../../services/technicianService';
import type { TechnicianTicketListItem } from '../../types/technician.types';
import type { TicketStatus, TicketPriority } from '../../types/ticket.types';

// ─── Catálogos ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TicketStatus, { label: string; badge: string; dot: string }> = {
  abierto:     { label: 'Abierto',     badge: 'bg-blue-100 text-blue-700 border border-blue-200',        dot: 'bg-blue-500' },
  en_progreso: { label: 'En progreso', badge: 'bg-amber-100 text-amber-700 border border-amber-200',     dot: 'bg-amber-500' },
  resuelto:    { label: 'Resuelto',    badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  cerrado:     { label: 'Cerrado',     badge: 'bg-slate-100 text-slate-500 border border-slate-200',     dot: 'bg-slate-400' },
  reabierto:   { label: 'Reabierto',   badge: 'bg-purple-100 text-purple-700 border border-purple-200',  dot: 'bg-purple-500' },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; badge: string; dot: string }> = {
  baja:    { label: 'Baja',    badge: 'bg-slate-100 text-slate-500',   dot: 'bg-slate-400' },
  media:   { label: 'Media',   badge: 'bg-blue-100 text-blue-600',     dot: 'bg-blue-500' },
  alta:    { label: 'Alta',    badge: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' },
  critica: { label: 'Crítica', badge: 'bg-red-100 text-red-600',       dot: 'bg-red-500' },
};

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todos los estados' },
  { value: 'abierto', label: 'Abierto' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'resuelto', label: 'Resuelto' },
  { value: 'cerrado', label: 'Cerrado' },
  { value: 'reabierto', label: 'Reabierto' },
];

const PRIORITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todas las prioridades' },
  { value: '1', label: 'Baja' },
  { value: '2', label: 'Media' },
  { value: '3', label: 'Alta' },
  { value: '4', label: 'Crítica' },
];

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todas las categorías' },
  { value: '1', label: 'Hardware' },
  { value: '2', label: 'Software' },
  { value: '3', label: 'Red/Conectividad' },
  { value: '4', label: 'Accesos y Permisos' },
  { value: '5', label: 'Correo Electrónico' },
  { value: '6', label: 'Otro' },
];

const LIMIT = 15;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const TicketSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-3/4 mb-1" /><div className="h-3 bg-slate-100 rounded w-1/3" /></td>
    <td className="px-4 py-3"><div className="h-5 bg-slate-100 rounded-full w-24" /></td>
    <td className="px-4 py-3"><div className="h-5 bg-slate-100 rounded-full w-20" /></td>
    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-28" /></td>
    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-20" /></td>
    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-16" /></td>
  </tr>
);

const FilterSelect = ({
  value, onChange, options, icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  icon: React.ReactNode;
}) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4">
      {icon}
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pl-9 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700
                 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50
                 appearance-none cursor-pointer hover:border-slate-300 transition-colors"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </span>
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────

const TechnicianTickets = () => {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<TechnicianTicketListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { setPage(1); }, [debouncedQuery, filterStatus, filterPriority, filterCategory]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        ...(filterStatus   && { status: filterStatus as TicketStatus }),
        ...(filterPriority && { priority_id: Number(filterPriority) as 1 | 2 | 3 | 4 }),
        ...(filterCategory && { category_id: Number(filterCategory) as 1 | 2 | 3 | 4 | 5 | 6 }),
        page,
        limit: LIMIT,
      };
      const data = debouncedQuery.trim()
        ? await searchTickets(debouncedQuery.trim(), filters)
        : await getTechnicianTickets(filters);
      setTickets(data.tickets);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los tickets');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filterStatus, filterPriority, filterCategory, page]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const totalPages = Math.ceil(total / LIMIT);
  const hasActiveFilters = !!(filterStatus || filterPriority || filterCategory || debouncedQuery);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('');
    setFilterPriority('');
    setFilterCategory('');
    setPage(1);
  };

  return (
    <div className="space-y-5">

      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tickets Asignados</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Cargando…' : `${total} ticket${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={fetchTickets}
          disabled={loading}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900
                     bg-white border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-lg
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* ── Barra de búsqueda + filtros ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en título y descripción…"
            className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg
                       focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-50
                       placeholder-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <FilterSelect
            value={filterStatus} onChange={setFilterStatus} options={STATUS_OPTIONS}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <FilterSelect
            value={filterPriority} onChange={setFilterPriority} options={PRIORITY_OPTIONS}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>}
          />
          <FilterSelect
            value={filterCategory} onChange={setFilterCategory} options={CATEGORY_OPTIONS}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
          />
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2 px-1 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={fetchTickets} className="ml-auto text-red-600 hover:text-red-800 font-medium underline underline-offset-2 text-xs">
            Reintentar
          </button>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Título', 'Estado', 'Prioridad', 'Categoría', 'Asignado a', 'Creado'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <TicketSkeleton key={i} />)
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
                        <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-slate-600 font-medium">No se encontraron tickets</p>
                      <p className="text-slate-400 text-xs">
                        {hasActiveFilters ? 'Prueba cambiando los filtros.' : 'No hay tickets disponibles.'}
                      </p>
                      {hasActiveFilters && (
                        <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2">
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => {
                  const status = STATUS_CONFIG[ticket.status];
                  const priority = PRIORITY_CONFIG[ticket.priority];
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => navigate(`/tecnico/tickets/${ticket.id}`)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-1">
                          {ticket.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">#{ticket.id.slice(0, 8).toUpperCase()}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${priority.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs whitespace-nowrap">{ticket.category}</td>
                      <td className="px-4 py-3.5">
                        {ticket.assigned_to
                          ? <span className="text-xs text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded">{ticket.assigned_to.slice(0, 8)}…</span>
                          : <span className="text-xs text-slate-400 italic">Sin asignar</span>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{formatDate(ticket.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-xs text-slate-500">Página {page} de {totalPages} — {total} resultados</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600
                           hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600
                           hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianTickets;
