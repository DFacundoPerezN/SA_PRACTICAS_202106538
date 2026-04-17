import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  PencilIcon, 
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { AdminService } from '../../services/adminServices';
import type { User, GetUsersParams } from '../../types/admin.types';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  


  // Filtros y paginación
  const [filters, setFilters] = useState<GetUsersParams>({
    page: 1,
    limit: 10,
    role: undefined,
  });
  
  // Modal de edición
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<string>('');
  const [editLoading, setEditLoading] = useState(false);
  
  // Modal de eliminación
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Mostrar/ocultar filtros en móvil
  const [showFilters, setShowFilters] = useState(false);

  // Cargar usuarios
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AdminService.getUsers(filters);
      setUsers(response.users);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filters.page, filters.limit, filters.role]);

  // Cambiar página
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Cambiar límite por página
  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }));
  };

  // Cambiar filtro de rol
  const handleRoleFilter = (role: string | undefined) => {
    setFilters(prev => ({ ...prev, role: role as any, page: 1 }));
    setShowFilters(false);
  };

  // Abrir modal de edición
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
  };

  // Guardar edición
  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    setEditLoading(true);
    try {
      const updateData: any = {};
      if (editName !== editingUser.name) updateData.name = editName;
      if (editRole !== editingUser.role) updateData.role = editRole;
      
      if (Object.keys(updateData).length === 0) {
        setEditingUser(null);
        return;
      }
      
      await AdminService.updateUser(editingUser.id, updateData);
      await loadUsers();
      setEditingUser(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar usuario');
    } finally {
      setEditLoading(false);
    }
  };

  // Abrir modal de eliminación
  const handleDeleteClick = (user: User) => {
    setDeletingUser(user);
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    
    setDeleteLoading(true);
    try {
      await AdminService.deleteUser(deletingUser.id);
      await loadUsers();
      setDeletingUser(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar usuario');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Obtener color de badge según rol
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'administrador':
        return 'bg-purple-100 text-purple-800';
      case 'tecnico':
        return 'bg-blue-100 text-blue-800';
      case 'cliente':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Capitalizar rol
  const capitalizeRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const totalPages = Math.ceil(total / (filters.limit || 10));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Total: {total} usuario{total !== 1 ? 's' : ''}
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
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por Rol
                </label>
                <select
                  value={filters.role || ''}
                  onChange={(e) => handleRoleFilter(e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los roles</option>
                  <option value="cliente">Cliente</option>
                  <option value="tecnico">Técnico</option>
                  <option value="administrador">Administrador</option>
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
                onClick={() => handleRoleFilter(undefined)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-2">{error}</div>
              <button
                onClick={loadUsers}
                className="text-blue-600 hover:text-blue-800"
              >
                Reintentar
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron usuarios con los filtros aplicados.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registrado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {capitalizeRole(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
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
                    Mostrando {((filters.page ?? 1) - 1) * (filters.limit ?? 10) + 1} -{' '}
                    {Math.min((filters.page ?? 1) * (filters.limit ?? 10), total)} de {total} usuarios
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange((filters.page ?? 1) - 1)}
                      disabled={(filters.page ?? 1) === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Página {filters.page} de {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange((filters.page ?? 1) + 1)}
                      disabled={(filters.page ?? 1) === totalPages}
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
      </div>

      {/* Modal de Edición */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setEditingUser(null)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Editar Usuario</h3>
                  <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="cliente">Cliente</option>
                      <option value="tecnico">Técnico</option>
                      <option value="administrador">Administrador</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {editLoading ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminación */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setDeletingUser(null)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-center text-gray-900 mb-2">Eliminar Usuario</h3>
                <p className="text-sm text-center text-gray-500">
                  ¿Estás seguro de que deseas eliminar a <span className="font-medium text-gray-900">{deletingUser.name}</span>?
                  <br />
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-center space-x-3">
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm disabled:opacity-50"
                >
                  {deleteLoading ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
                <button
                  onClick={() => setDeletingUser(null)}
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;