import React, { useState } from 'react';
import { EnvelopeIcon, LockClosedIcon, UserGroupIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { AdminService } from '../../services/adminServices';
import type { RegisterUserFormData, RegisterUserResponse } from '../../types/admin.types';
import { UserRole, UserRoleLabels } from '../../types/admin.types';

const AdminRegisterUser: React.FC = () => {
  const [formData, setFormData] = useState<RegisterUserFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    rol: UserRole.CLIENTE,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Manejar cambios en los inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rol' ? parseInt(value) : value,
    }));

    // Limpiar errores del campo específico
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Limpiar mensajes de éxito/error
    setSuccessMessage(null);
    setServerError(null);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    const validationErrors = AdminService.validateForm(
      formData.email,
      formData.password,
      formData.confirmPassword
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const response: RegisterUserResponse = await AdminService.registerUser({
        email: formData.email,
        password: formData.password,
        rol: formData.rol,
      });

      // Mostrar mensaje de éxito
      setSuccessMessage(`${response.message} | ID: ${response.user_id} | Rol: ${response.role}`);
      
      // Limpiar formulario
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        rol: UserRole.CLIENTE,
      });
      
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Error al registrar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-[#f8fafc] rounded-xl shadow-lg overflow-hidden">
        <div className="px-8 py-6">
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Registrar Nuevo Usuario
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Crea cuentas para clientes, técnicos o administradores
            </p>
          </div>

          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-500 hover:text-green-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Mensaje de error del servidor */}
          {serverError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{serverError}</p>
              </div>
              <button
                onClick={() => setServerError(null)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo de Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm`}
                  placeholder="usuario@ejemplo.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Campo de Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm`}
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Campo de Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm`}
                  placeholder="Repite la contraseña"
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Campo de Rol */}
            <div>
              <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-2">
                Rol *
              </label>
              <select
                id="rol"
                name="rol"
                value={formData.rol}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                disabled={loading}
              >
                <option value={UserRole.CLIENTE}>{UserRoleLabels[UserRole.CLIENTE]}</option>
                <option value={UserRole.TECNICO}>{UserRoleLabels[UserRole.TECNICO]}</option>
                <option value={UserRole.ADMINISTRADOR}>{UserRoleLabels[UserRole.ADMINISTRADOR]}</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Define el nivel de acceso del usuario en el sistema
              </p>
            </div>

            {/* Botón de Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center space-x-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <UserGroupIcon className="h-5 w-5" />
                  <span>Registrar Usuario</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterUser;