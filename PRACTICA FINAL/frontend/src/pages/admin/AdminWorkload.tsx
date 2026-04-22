import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { AdminService } from '../../services/adminServices';
import { UserService } from '../../services/userService';
import type { WorkloadItem } from '../../types/admin.types';
import type { User } from '../../types/users.type';

interface EnhancedWorkloadItem extends WorkloadItem {
  technicianName?: string;
  technicianEmail?: string;
}

const AdminWorkload: React.FC = () => {
  const [workload, setWorkload] = useState<EnhancedWorkloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadWorkload = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Obtener carga de trabajo
      const response = await AdminService.getWorkload();
      // Defensive: asegurar que workloadData sea siempre un array
      let workloadData: EnhancedWorkloadItem[] = Array.isArray(response?.workload) ? response.workload : [];
      
      // Obtener detalles de los técnicos
      try {
        const techniciansResponse = await UserService.getUsers({ 
          role: 'tecnico',
          limit: 100 
        });

        // Defensive: asegurar que users sea siempre un array antes de operar
        const techniciansList: User[] = Array.isArray(techniciansResponse?.users)
          ? techniciansResponse.users
          : [];

        // Filtrar solo los técnicos activos
        const activeTechnicians = techniciansList.filter(tech => tech.isActive);
        
        // Crear un mapa de ID a nombre/email
        const technicianMap = new Map<string, { name: string; email: string }>();
        activeTechnicians.forEach((tech: User) => {
          technicianMap.set(tech.id, {
            name: tech.name,
            email: tech.email
          });
        });

        // Enriquecer los datos de workload
        workloadData = workloadData.map(item => ({
          ...item,
          technicianName: technicianMap.get(item.technicianId)?.name || 'Técnico sin nombre',
          technicianEmail: technicianMap.get(item.technicianId)?.email || 'Email no disponible'
        }));
      } catch (err) {
        console.error('Error al obtener nombres de técnicos:', err);
        // Si falla, solo mostramos los IDs (workloadData sin enriquecer)
      }
      
      setWorkload(workloadData);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la carga de trabajo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWorkload();
    // Actualizar automáticamente cada 30 segundos
    const interval = setInterval(() => {
      loadWorkload(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getWorkloadColor = (activeTickets: number) => {
    if (activeTickets === 0) return 'bg-green-100 text-green-800';
    if (activeTickets <= 3) return 'bg-yellow-100 text-yellow-800';
    if (activeTickets <= 6) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getWorkloadIcon = (activeTickets: number) => {
    if (activeTickets === 0) return '🟢';
    if (activeTickets <= 3) return '🟡';
    if (activeTickets <= 6) return '🟠';
    return '🔴';
  };

  const getWorkloadStatus = (activeTickets: number) => {
    if (activeTickets === 0) return 'Sin carga';
    if (activeTickets <= 3) return 'Carga baja';
    if (activeTickets <= 6) return 'Carga moderada';
    return 'Carga alta';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const totalActiveTickets = workload.reduce((sum, item) => sum + (item.activeTickets ?? 0), 0);
  const averageLoad = workload.length > 0 ? (totalActiveTickets / workload.length).toFixed(1) : 0;
  const availableTechnicians = workload.filter(w => w.activeTickets === 0).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Carga de Trabajo - Técnicos</h1>
                <p className="text-sm text-gray-500 mt-1">
                  RF-22: Balanceo de carga y asignación automática
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-xs text-gray-500">
                Última actualización: {formatDate(lastRefresh.toISOString())}
              </div>
              <button
                onClick={() => loadWorkload(true)}
                disabled={refreshing}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Técnicos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{workload.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tickets Activos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalActiveTickets}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio por Técnico</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{averageLoad}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Técnicos Disponibles</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{availableTechnicians}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de carga de trabajo */}
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
                onClick={() => loadWorkload()}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <ArrowPathIcon className="h-5 w-5" />
                <span>Reintentar</span>
              </button>
            </div>
          ) : workload.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay técnicos registrados</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron técnicos en el sistema.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Técnico
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tickets Activos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Última Actualización
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {workload.map((item, index) => (
                      <tr key={item.technicianId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-blue-600" />
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.technicianName || item.technicianId?.substring(0, 8) || 'ID desconocido'}
                              </div>
                              {item.technicianEmail && (
                                <div className="text-xs text-gray-500">
                                  {item.technicianEmail}
                                </div>
                              )}
                              {!item.technicianName && item.technicianId && (
                                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                                  {item.technicianId}
                                </code>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getWorkloadIcon(item.activeTickets ?? 0)}</span>
                            <span className={`text-sm font-medium ${getWorkloadColor(item.activeTickets ?? 0)}`}>
                              {getWorkloadStatus(item.activeTickets ?? 0)}
                            </span>
                          </div>
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 max-w-[200px]">
                              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    (item.activeTickets ?? 0) === 0 ? 'bg-green-500' :
                                    (item.activeTickets ?? 0) <= 3 ? 'bg-yellow-500' :
                                    (item.activeTickets ?? 0) <= 6 ? 'bg-orange-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(((item.activeTickets ?? 0) / 10) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                            <span className={`text-sm font-bold ${getWorkloadColor(item.activeTickets ?? 0)}`}>
                              {item.activeTickets ?? 0}
                            </span>
                          </div>
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.lastUpdated ? formatDate(item.lastUpdated) : '-'}
                         </td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Leyenda */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <span className="font-medium text-gray-700">Leyenda:</span>
                  <div className="flex items-center space-x-1">
                    <span>🟢</span>
                    <span className="text-gray-600">Sin carga</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>🟡</span>
                    <span className="text-gray-600">Carga baja (1-3 tickets)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>🟠</span>
                    <span className="text-gray-600">Carga moderada (4-6 tickets)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>🔴</span>
                    <span className="text-gray-600">Carga alta (7+ tickets)</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Información del algoritmo de asignación */}
        {!loading && workload.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="p-1 bg-blue-100 rounded-lg">
                  <ChartBarIcon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900">Algoritmo de Asignación Automática (RF-22)</h4>
                <p className="text-sm text-blue-700 mt-1">
                  El sistema asigna automáticamente nuevos tickets al técnico con la menor carga de trabajo activa.
                  {availableTechnicians > 0 
                    ? ` Actualmente hay ${availableTechnicians} técnico${availableTechnicians !== 1 ? 's' : ''} sin carga asignada.`
                    : ' Actualmente todos los técnicos tienen carga asignada.'}
                </p>
                {workload.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    Próximo técnico para asignación: <strong>
                      {workload[0].technicianName || workload[0].technicianId?.substring(0, 8) || 'ID desconocido'}
                    </strong> ({workload[0].activeTickets ?? 0} tickets activos)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWorkload;
