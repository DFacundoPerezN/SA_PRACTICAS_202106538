import React, { useState, useEffect } from 'react';
import { 
  ClipboardDocumentListIcon,
  UserIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { AdminService } from '../../services/adminServices';
import { UserService } from '../../services/userService';
import type { 
  EnhancedAssignment, 
  GetAssignmentsParams,
  AdminTicket 
} from '../../types/admin.types';
import type { User } from '../../types/users.type';

const AdminAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<EnhancedAssignment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mapas de datos
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());
  const [ticketMap, setTicketMap] = useState<Map<string, AdminTicket>>(new Map());
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  
  // Filtros y paginación
  const [filters, setFilters] = useState<GetAssignmentsParams>({
    status: 'asignado',
    page: 1,
    limit: 20,
  });
  
  // Mostrar/ocultar filtros en móvil
  const [showFilters, setShowFilters] = useState(false);
  // Mostrar/ocultar filtros avanzados
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Cargar todos los usuarios para mapear IDs a emails
  const loadAllUsers = async () => {
    try {
      const [clientsResponse, techniciansResponse, adminsResponse] = await Promise.all([
        UserService.getUsers({ role: 'cliente', limit: 100 }),
        UserService.getUsers({ role: 'tecnico', limit: 100 }),
        UserService.getUsers({ role: 'administrador', limit: 100 }),
      ]);

      // Defensive: asegurar que cada lista sea siempre un array
      const clients: User[] = Array.isArray(clientsResponse?.users) ? clientsResponse.users : [];
      const techs: User[] = Array.isArray(techniciansResponse?.users) ? techniciansResponse.users : [];
      const admins: User[] = Array.isArray(adminsResponse?.users) ? adminsResponse.users : [];

      const allUsers = [...clients, ...techs, ...admins];
      const map = new Map<string, User>();
      allUsers.forEach(user => map.set(user.id, user));
      setUserMap(map);

      // Guardar técnicos para el filtro
      setTechnicians(techs);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  // Cargar tickets para el filtro y mapeo
  const loadTicketsForFilters = async () => {
    setLoadingFilters(true);
    try {
      const response = await AdminService.getTicketsForFilter({ limit: 200 });

      // Defensive: asegurar que tickets sea siempre un array
      const ticketList: AdminTicket[] = Array.isArray(response?.tickets) ? response.tickets : [];

      setTickets(ticketList);
      const map = new Map<string, AdminTicket>();
      ticketList.forEach(ticket => map.set(ticket.id, ticket));
      setTicketMap(map);
    } catch (err) {
      console.error('Error al cargar tickets:', err);
    } finally {
      setLoadingFilters(false);
    }
  };

  // Cargar asignaciones
  const loadAssignments = async (showRefresh = false) => {
    if (showRefresh) {
      setLoading(true);
      setError(null);
    }
    
    try {
      const response = await AdminService.getAssignments(filters);

      // Defensive: asegurar que assignments sea siempre un array
      const assignmentList = Array.isArray(response?.assignments) ? response.assignments : [];

      // Enriquecer asignaciones con emails y nombres
      const enhanced = assignmentList.map(assignment => ({
        ...assignment,
        technicianEmail: userMap.get(assignment.technicianId)?.email,
        technicianName: userMap.get(assignment.technicianId)?.name,
        assignedByEmail: assignment.assignedBy ? userMap.get(assignment.assignedBy)?.email : undefined,
        assignedByName: assignment.assignedBy ? userMap.get(assignment.assignedBy)?.name : undefined,
        ticketTitle: ticketMap.get(assignment.ticketId)?.title,
      }));
      
      setAssignments(enhanced);
      setTotal(response?.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las asignaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllUsers();
    loadTicketsForFilters();
  }, []);

  useEffect(() => {
    if (userMap.size > 0 && ticketMap.size > 0) {
      loadAssignments();
    }
  }, [filters, userMap.size, ticketMap.size]);

  // Cambiar página
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Cambiar límite por página
  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }));
  };

  // Cambiar filtro de estado
  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status: status as any, page: 1 }));
    setShowFilters(false);
  };

  // Cambiar filtro de técnico
  const handleTechnicianFilter = (technicianId: string) => {
    setFilters(prev => ({ ...prev, technician_id: technicianId || undefined, page: 1 }));
  };

  // Cambiar filtro de ticket
  const handleTicketFilter = (ticketId: string) => {
    setFilters(prev => ({ ...prev, ticket_id: ticketId || undefined, page: 1 }));
  };

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setFilters({
      status: 'asignado',
      page: 1,
      limit: filters.limit,
    });
    setShowAdvancedFilters(false);
  };

  // Obtener badge de estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'asignado':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'reasignado':
        return 'bg-blue-100 text-blue-800';
      case 'cerrado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'asignado':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'pendiente':
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      case 'reasignado':
        return <ArrowPathIcon className="h-4 w-4 text-blue-600" />;
      case 'cerrado':
        return <XMarkIcon className="h-4 w-4 text-gray-600" />;
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
  const truncateText = (text: string | null | undefined, maxLength: number = 40): string => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const totalPages = Math.ceil(total / (filters.limit || 20));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Asignaciones</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Total: {total} asignación{total !== 1 ? 'es' : ''}
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
        </div>

        {/* Filtros */}
        <div className={`${showFilters ? 'block' : 'hidden sm:block'} mb-6`}>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="asignado">Asignado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="reasignado">Reasignado</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>
              
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mostrar
                </label>
                <select
                  value={filters.limit}
                  onChange={handleLimitChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {showAdvancedFilters ? 'Ocultar avanzados' : 'Filtros avanzados'}
              </button>
              
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50"
              >
                Limpiar filtros
              </button>
            </div>

            {/* Filtros avanzados */}
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filtrar por Técnico
                    </label>
                    <select
                      value={filters.technician_id || ''}
                      onChange={(e) => handleTechnicianFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Todos los técnicos</option>
                      {technicians.map(tech => (
                        <option key={tech.id} value={tech.id}>
                          {tech.email} ({tech.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filtrar por Ticket
                    </label>
                    <select
                      value={filters.ticket_id || ''}
                      onChange={(e) => handleTicketFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loadingFilters}
                    >
                      <option value="">Todos los tickets</option>
                      {tickets.map(ticket => (
                        <option key={ticket.id} value={ticket.id}>
                          {truncateText(ticket.title, 30)} - {ticket.status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de asignaciones */}
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
                onClick={() => loadAssignments()}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span>Reintentar</span>
              </button>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay asignaciones</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron asignaciones con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ticket
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Técnico Asignado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asignado por
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de Asignación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.ticketTitle || truncateText(assignment.ticketId, 20)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ID: {assignment.ticketId?.substring(0, 8) ?? '-'}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-sm text-gray-900">
                                {assignment.technicianName || 'Sin nombre'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {assignment.technicianEmail || assignment.technicianId?.substring(0, 8) || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            {assignment.status ? getStatusIcon(assignment.status) : null}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(assignment.status || '')}`}>
                              {assignment.status
                                ? assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)
                                : 'Sin estado'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-sm text-gray-900">
                                {assignment.assignedByName || (assignment.assignedBy ? 'Sin nombre' : 'Sistema')}
                              </div>
                              {assignment.assignedByEmail && (
                                <div className="text-xs text-gray-500">
                                  {assignment.assignedByEmail}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {formatDate(assignment.assignedAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs">
                            {truncateText(assignment.notes, 50)}
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
                    Mostrando {((filters.page ?? 1) - 1) * (filters.limit ?? 20) + 1} -{' '}
                    {Math.min((filters.page ?? 1) * (filters.limit ?? 20), total)} de {total} asignaciones
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange((filters.page ?? 1) - 1)}
                      disabled={filters.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Página {filters.page ?? 1} de {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange((filters.page ?? 1) + 1)}
                      disabled={filters.page === totalPages}
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

        {/* Leyenda de estados */}
        {!loading && assignments.length > 0 && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="font-medium text-gray-700">Estados:</span>
              <div className="flex items-center space-x-1">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-gray-600">Asignado</span>
              </div>
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4 text-yellow-600" />
                <span className="text-gray-600">Pendiente</span>
              </div>
              <div className="flex items-center space-x-1">
                <ArrowPathIcon className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600">Reasignado</span>
              </div>
              <div className="flex items-center space-x-1">
                <XMarkIcon className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">Cerrado</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAssignments;
