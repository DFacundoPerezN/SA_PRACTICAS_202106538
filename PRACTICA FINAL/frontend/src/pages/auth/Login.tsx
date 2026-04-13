import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setSession } from '../../utils/authStorage';
import { CONFIG } from '../../config/config';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      if (!response.ok) {
        throw new Error('Credenciales incorrectas');
      }

      const data = await response.json();

      //primero comprobar si el usuario ya tiene wallet, si no, crearla
      const walletResponse = await fetch(`${CONFIG.API_URL}/wallet/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.accessToken}`,
        },
      });

      if (walletResponse.status === 404) {
        // Si no tiene wallet, crearla
        await fetch(`${CONFIG.API_URL}/payment/wallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.accessToken}`,
          },
          body: JSON.stringify({}),
        });
      }
      
      // Guardar sesión con la estructura esperada del primer login
      setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      // Redirección por rol (lógica del primer login)
      const payload = JSON.parse(atob(data.accessToken.split(".")[1]));

      switch (payload.role) {
        case "ADMINISTRADOR":
          navigate("/admin/users");
          break;
        case "RESTAURANTE":
          navigate("/restaurant/orders");
          break;
        case "REPARTIDOR":
          navigate("/delivery/available");
          break;
        case "USUARIO": // Añadido por si necesitas manejar usuarios normales
          navigate("/");
          break;
        default:
          navigate("/");
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error en la conexión al servidor');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      {/* Efecto de partículas de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md">
        {/* Tarjeta de Login */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg 
                className="w-8 h-8 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Bienvenido a Delivereats
            </h1>
            <p className="text-indigo-100 text-sm">
              Tu puerta de entrada a la mejor experiencia gastronómica
            </p>
          </div>

          {/* Formulario */}
          <div className="p-8">
            <form onSubmit={handleSubmit}>
              {/* Campo Email */}
              <div className="mb-6">
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <div className="flex items-center">
                    <svg 
                      className="w-5 h-5 text-indigo-500 mr-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" 
                      />
                    </svg>
                    Email
                  </div>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 outline-none"
                  placeholder="usuario@ejemplo.com"
                  required
                  disabled={loading}
                />
              </div>

              {/* Campo Contraseña */}
              <div className="mb-8">
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <div className="flex items-center">
                    <svg 
                      className="w-5 h-5 text-indigo-500 mr-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                      />
                    </svg>
                    Contraseña
                  </div>
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 outline-none"
                  placeholder="Ingresa tu contraseña"
                  required
                  disabled={loading}
                />
              </div>

              {/* Botón de Login */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg 
                      className="w-5 h-5 mr-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
                      />
                    </svg>
                    Iniciar Sesión
                  </div>
                )}
              </button>
            </form>

            {/* Link a Registro */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm">
                ¿No tienes una cuenta?{' '}
                <Link 
                  to="/register" 
                  className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors duration-200 hover:underline"
                >
                  Regístrate ahora
                </Link>
              </p>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="mt-4 animate-fade-in">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                  <svg 
                    className="w-5 h-5 mr-2 flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-white/80 text-sm">
          <p>© 2024 Delivereats. Todos los derechos reservados.</p>
          <p className="mt-1 text-white/60 text-xs">
            La mejor experiencia gastronómica a un clic de distancia.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;