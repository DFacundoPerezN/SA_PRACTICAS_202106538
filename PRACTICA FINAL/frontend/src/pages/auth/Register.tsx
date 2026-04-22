import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerRequest } from '../../services/authService';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      showError('Por favor completa todos los campos');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError('Por favor ingresa un email válido');
      return;
    }

    if (formData.password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await registerRequest({
        email: formData.email,
        password: formData.password,
      });

      setSuccess('¡Registro exitoso! Redirigiendo al login...');
      setFormData({ email: '', password: '', confirmPassword: '' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      console.error('Error en registro:', err);
      showError(err.message || 'Error en la conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Partículas decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-slate-700 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Crear cuenta</h1>
            <p className="text-blue-200 text-sm">Regístrate como cliente en HelpDesk</p>
          </div>

          {/* Formulario */}
          <div className="p-8">
            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="mb-5">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                  placeholder="usuario@empresa.com"
                  required
                  disabled={loading}
                />
              </div>

              {/* Contraseña */}
              <div className="mb-5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                  placeholder="Mínimo 6 caracteres"
                  required
                  disabled={loading}
                />
              </div>

              {/* Confirmar contraseña */}
              <div className="mb-8">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                  placeholder="Repite tu contraseña"
                  required
                  disabled={loading}
                />
              </div>

              {/* Botón */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-700 to-slate-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-800 hover:to-slate-800 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Registrando...
                  </div>
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </form>

            {/* Link al login */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                ¿Ya tienes cuenta?{' '}
                <Link
                  to="/login"
                  className="text-blue-600 font-medium hover:text-blue-800 transition-colors duration-200 hover:underline"
                >
                  Inicia sesión aquí
                </Link>
              </p>
            </div>

            {/* Éxito */}
            {success && (
              <div className="mt-4">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">{success}</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-white/60 text-xs">
          <p>© {new Date().getFullYear()} HelpDesk. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
