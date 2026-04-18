import React, { useState, useEffect } from 'react';
import { 
  TicketIcon, 
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { UserService } from '../../services/userService';
import type { User } from '../../types/users.type';
import type { AdminTicket, AdminGetTicketsParams } from '../../types/admin.types';
import { AdminService } from '../../services/adminServices';

const AdminTickets: React.FC = () => {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mapa de usuarios (id -> email)
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Filtros y paginación
  const [filters, setFilters] = useState<AdminGetTicketsParams>({
    status: 'abierto',
    page: 1,
    limit: 20,
  });
  
  // Mostrar/ocultar filtros en móvil
  const [showFilters, setShowFilters] = useState(false);

  // Obtener todos los usuarios para mapear IDs a emails
  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      // Obtener clientes, técnicos y administradores en paralelo
      const [clientsResponse, techniciansResponse, adminsResponse] = await Promise.all([
        UserService.getUsers({ role: 'cliente', limit: 100 }),
        UserService.getUsers({ role: 'tecnico', limit: 100 }),
        UserService.getUsers({ role: 'administrador', limit: 100 }),
      ]);

      // Defensive: asegurar que cada lista sea siempre un array
      const clients: User[] = Array.isArray(clientsResponse?.users) ? clientsResponse.users : [];
      const technicians: User[] = Array.isArray(techniciansResponse?.users) ? techniciansResponse.users : [];
      const admins: User[] = Array.isArray(adminsResponse?.users) ? adminsResponse.users : [];

      const allUsers = [...clients, ...technicians, ...admins];
      const map = new Map<string, User>();
      allUsers.forEach(user => map.set(user.id, user));
      setUserMap(map);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Obtener tickets
  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      queryParams.append('page', (filters.page ?? 1).toString());
      queryParams.append('limit', (filters.limit ?? 20).toString());

      const result = await AdminService.getTickets(Object.fromEntries(queryParams));
      
      // Defensive: asegurar que tickets sea siempre un array
      setTickets(Array.isArray(result?.tickets) ? result.tickets : []);
      setTotal(result?.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllUsers();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [filters.status, filters.page, filters.limit]);

  // Cambiar página
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Cambiar filtro de estado
  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
    setShowFilters(false);
  };

  // Obtener email por ID
  const getUserEmail = (userId: string | null | undefined): string => {
    if (!userId) return 'No asignado';
    const user = userMap.get(userId);
    return user ? user.email : 'Cargando...';
  };

  // Obtener color de prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica':
        return 'bg-red-100 text-red-800';
      case 'alta':
        return 'bg-orange-100 text-orange-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baja':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener ícono de prioridad
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critica':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
      case 'alta':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />;
      case 'media':
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      case 'baja':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Truncar texto
  const truncateText = (text: string | null | undefined, maxLength: number = 50): string => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const currentPage = filters.page ?? 1;
  const currentLimit = filters.limit ?? 20;
  const totalPages = Math.ceil(total / currentLimit);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TicketIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Tickets</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Total: {total} ticket{total !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Filtros</span>
            </button>
          </div>

          {/* Filtros */}
          <div className={`mt-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
            <div className="flex flex-wrap gap-4">
              {/* Filtro de estado */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="abierto">Abierto</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="cerrado">Cerrado</option>
                  <option value="">Todos</option>
                </select>
              </div>

              {/* Límite de resultados */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mostrar
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de tickets */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
              <div className="text-red-600 mt-2 mb-4">{error}</div>
              <button
                onClick={loadTickets}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span>Reintentar</span>
              </button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tickets</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron tickets con el estado seleccionado.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Título
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prioridad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Creado por
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asignado a
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de creación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {truncateText(ticket.title, 40)}
                            </div>
                            {ticket.description && (
                              <div className="text-xs text-gray-500 mt-1">
                                {truncateText(ticket.description, 50)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {ticket.category || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            {ticket.priority ? getPriorityIcon(ticket.priority) : null}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority || '')}`}>
                              {ticket.priority
                                ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)
                                : 'Sin prioridad'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {loadingUsers ? 'Cargando...' : getUserEmail(ticket.createdBy)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span className={`text-sm ${ticket.assignedTo ? 'text-gray-600' : 'text-yellow-600 font-medium'}`}>
                              {loadingUsers ? 'Cargando...' : getUserEmail(ticket.assignedTo)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {formatDate(ticket.createdAt)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {(currentPage - 1) * currentLimit + 1} -{' '}
                    {Math.min(currentPage * currentLimit, total)} de {total} tickets
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Leyenda de prioridades */}
        {!loading && tickets.length > 0 && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="font-medium text-gray-700">Prioridades:</span>
              <div className="flex items-center space-x-1">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                <span className="text-gray-600">Crítica</span>
              </div>
              <div className="flex items-center space-x-1">
                <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
                <span className="text-gray-600">Alta</span>
              </div>
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4 text-yellow-600" />
                <span className="text-gray-600">Media</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-gray-600">Baja</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTickets;
