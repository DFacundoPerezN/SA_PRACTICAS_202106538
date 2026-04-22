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

// Cada problema lleva la prioridad que le corresponde
type Problem = { label: string; priority: PriorityId };

const PROBLEMS_BY_CATEGORY: Record<CategoryId, Problem[]> = {
  1: [
    { label: 'La computadora no enciende al presionar el botón de encendido.',   priority: 4 },
    { label: 'El equipo se apaga repentinamente después de unos minutos de uso.', priority: 3 },
    { label: 'El disco duro no es reconocido por el sistema.',                    priority: 4 },
    { label: 'El teclado o mouse dejan de responder de forma intermitente.',      priority: 2 },
    { label: 'La pantalla muestra líneas o no da imagen correctamente.',          priority: 3 },
  ],
  2: [
    { label: 'Una aplicación se cierra inesperadamente al intentar abrirla.',         priority: 2 },
    { label: 'El sistema operativo se vuelve lento después de una actualización.',    priority: 1 },
    { label: 'No se puede instalar un programa por errores de compatibilidad.',       priority: 2 },
    { label: 'Aparece un mensaje de error al iniciar el sistema.',                    priority: 3 },
    { label: 'El antivirus detecta amenazas constantemente en el equipo.',            priority: 4 },
  ],
  3: [
    { label: 'No hay conexión a internet aunque el cable esté conectado.',         priority: 4 },
    { label: 'La red WiFi aparece pero no permite navegar.',                        priority: 3 },
    { label: 'La conexión es muy lenta en comparación con lo habitual.',            priority: 2 },
    { label: 'No se puede acceder a recursos compartidos en la red.',               priority: 2 },
    { label: 'El equipo pierde la conexión de forma intermitente.',                 priority: 3 },
  ],
  4: [
    { label: 'El usuario no puede iniciar sesión con sus credenciales.',              priority: 4 },
    { label: 'Se deniega el acceso a ciertas carpetas o archivos.',                   priority: 2 },
    { label: 'La cuenta se bloquea después de varios intentos fallidos.',             priority: 3 },
    { label: 'No se tienen permisos para instalar aplicaciones.',                     priority: 2 },
    { label: 'El sistema solicita permisos de administrador constantemente.',         priority: 1 },
  ],
  5: [
    { label: 'No se pueden enviar correos desde la cuenta.',                   priority: 3 },
    { label: 'Los correos no llegan a la bandeja de entrada.',                 priority: 3 },
    { label: 'El cliente de correo no sincroniza correctamente.',              priority: 2 },
    { label: 'Los archivos adjuntos no se pueden abrir.',                      priority: 2 },
    { label: 'Se reciben correos sospechosos o de spam constantemente.',       priority: 1 },
  ],
  6: [
    { label: 'El sistema presenta comportamientos inesperados sin causa aparente.',  priority: 3 },
    { label: 'Se requiere capacitación para el uso de una herramienta.',             priority: 1 },
    { label: 'El usuario necesita configurar un nuevo dispositivo.',                 priority: 2 },
    { label: 'Se solicita asesoría sobre buenas prácticas de seguridad.',            priority: 1 },
    { label: 'Se reporta un problema que no encaja en las categorías anteriores.',   priority: 2 },
    { label: 'Mi pregunta no está en las anteriores.',                               priority: 2 },
  ],
};


// ─── Componente ───────────────────────────────────────────────────────────────

const ClientNewTicket = () => {
  const navigate = useNavigate();

  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [problemIndex, setProblemIndex] = useState<number | null>(null); // índice dentro de PROBLEMS_BY_CATEGORY[categoryId]

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Prioridad derivada automáticamente del problema seleccionado
  const selectedProblem: Problem | null =
    categoryId !== null && problemIndex !== null
      ? PROBLEMS_BY_CATEGORY[categoryId][problemIndex]
      : null;

  const priorityId: PriorityId | null = selectedProblem?.priority ?? null;

  // Validaciones
  const titleError       = title.length > 0 && title.trim().length < 5;
  const descriptionError = description.length > 0 && description.trim().length < 10;
  const canSubmit =
    title.trim().length >= 5 &&
    description.trim().length >= 10 &&
    categoryId !== null &&
    selectedProblem !== null;

  const handleCategoryChange = (id: CategoryId) => {
    setCategoryId(id);
    setProblemIndex(null); // resetear problema al cambiar categoría
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !categoryId || priorityId === null) return;

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
                onClick={() => handleCategoryChange(cat.id)}
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

        {/* Problema (select dinámico según categoría) */}
        {categoryId !== null && (
          <div>
            <label htmlFor="problem" className="block text-sm font-medium text-slate-700 mb-1.5">
              ¿Cuál es tu problema? <span className="text-red-500">*</span>
            </label>
            <select
              id="problem"
              disabled={loading}
              value={problemIndex ?? ''}
              onChange={(e) => setProblemIndex(e.target.value === '' ? null : Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white
                focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-colors
                disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">— Selecciona la opción que mejor describe tu problema —</option>
              {PROBLEMS_BY_CATEGORY[categoryId].map((problem, idx) => (
                <option key={idx} value={idx}>
                  {problem.label}
                </option>
              ))}
            </select>
          </div>
        )}

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
