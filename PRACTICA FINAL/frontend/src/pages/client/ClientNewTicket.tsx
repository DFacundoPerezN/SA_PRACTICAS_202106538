import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../../services/ticketService';
import type { CategoryId, PriorityId } from '../../types/ticket.types';

// ─── Catálogos ────────────────────────────────────────────────────────────────

const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: 1, label: 'Hardware',            icon: '🖥️' },
  { id: 2, label: 'Software',            icon: '💾' },
  { id: 3, label: 'Red / Conectividad',  icon: '🌐' },
  { id: 4, label: 'Accesos y Permisos',  icon: '🔐' },
  { id: 5, label: 'Correo Electrónico',  icon: '📧' },
  { id: 6, label: 'Otro',               icon: '📋' },
];

const PRIORITIES: { id: PriorityId; label: string; description: string; color: string }[] = [
  { id: 1, label: 'Baja',    description: 'Sin urgencia',          color: 'border-slate-300 peer-checked:border-slate-500 peer-checked:bg-slate-50' },
  { id: 2, label: 'Media',   description: 'Afecta productividad',  color: 'border-slate-300 peer-checked:border-blue-500 peer-checked:bg-blue-50' },
  { id: 3, label: 'Alta',    description: 'Requiere atención hoy', color: 'border-slate-300 peer-checked:border-orange-500 peer-checked:bg-orange-50' },
  { id: 4, label: 'Crítica', description: 'Sistema inoperante',    color: 'border-slate-300 peer-checked:border-red-500 peer-checked:bg-red-50' },
];

const PRIORITY_LABEL_COLOR: Record<PriorityId, string> = {
  1: 'text-slate-500',
  2: 'text-blue-600',
  3: 'text-orange-600',
  4: 'text-red-600 font-semibold',
};

// ─── Componente ───────────────────────────────────────────────────────────────

const ClientNewTicket = () => {
  const navigate = useNavigate();

  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [priorityId, setPriorityId] = useState<PriorityId>(2); // media por defecto

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Validaciones en tiempo real
  const titleError       = title.length > 0 && title.trim().length < 5;
  const descriptionError = description.length > 0 && description.trim().length < 10;
  const canSubmit        = title.trim().length >= 5 && description.trim().length >= 10 && categoryId !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !categoryId) return;

    setLoading(true);
    setError(null);

    try {
      const ticket = await createTicket({
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId,
        priority_id: priorityId,
      });
      navigate(`/client/tickets/${ticket.id}`, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Error al crear el ticket');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/client/tickets')}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Volver"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nuevo ticket</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Describe el problema y te asignaremos un técnico lo antes posible.
          </p>
        </div>
      </div>

      {/* ── Formulario ── */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">

        {/* Título */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: No puedo acceder a mi correo corporativo"
            disabled={loading}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none
              ${titleError
                ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
              } disabled:bg-slate-50 disabled:text-slate-400`}
          />
          {titleError && (
            <p className="text-xs text-red-500 mt-1">El título debe tener al menos 5 caracteres.</p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe el problema con el mayor detalle posible: cuándo ocurrió, pasos para reproducirlo, mensajes de error, etc."
            disabled={loading}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none resize-none
              ${descriptionError
                ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
              } disabled:bg-slate-50 disabled:text-slate-400`}
          />
          <div className="flex justify-between mt-1">
            {descriptionError
              ? <p className="text-xs text-red-500">La descripción debe tener al menos 10 caracteres.</p>
              : <span />
            }
            <p className="text-xs text-slate-400 ml-auto">{description.length} caracteres</p>
          </div>
        </div>

        {/* Categoría */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">
            Categoría <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                disabled={loading}
                onClick={() => setCategoryId(cat.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left
                  ${categoryId === cat.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="text-base leading-none">{cat.icon}</span>
                <span className="leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prioridad */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Prioridad</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={loading}
                onClick={() => setPriorityId(p.id)}
                className={`flex flex-col gap-0.5 px-3 py-3 rounded-lg border text-left transition-all
                  ${priorityId === p.id
                    ? `border-2 ${
                        p.id === 1 ? 'border-slate-500 bg-slate-50' :
                        p.id === 2 ? 'border-blue-500 bg-blue-50' :
                        p.id === 3 ? 'border-orange-500 bg-orange-50' :
                                     'border-red-500 bg-red-50'
                      }`
                    : 'border-slate-200 bg-white hover:border-slate-400'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className={`text-sm font-semibold ${PRIORITY_LABEL_COLOR[p.id]}`}>
                  {p.label}
                </span>
                <span className="text-xs text-slate-400 leading-tight">{p.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error global */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/client/tickets')}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="flex-1 sm:flex-none sm:px-8 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Enviar ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientNewTicket;