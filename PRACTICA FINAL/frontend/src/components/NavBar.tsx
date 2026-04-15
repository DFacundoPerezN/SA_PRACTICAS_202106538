import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout, getUser } from "../utils/authStorage";
import {
  TicketIcon,
  UsersIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const NavBar = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHoverEnabled, setIsHoverEnabled] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsExpanded(false);
        setIsHoverEnabled(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    setIsHoverEnabled(!isHoverEnabled);
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      localStorage.clear();
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const linkClass =
    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group";
  const activeClass = "bg-blue-600 text-white shadow-md";
  const inactiveClass = "text-slate-300 hover:bg-slate-800 hover:text-white";

  // Etiqueta e icono del rol
  const roleLabel: Record<string, string> = {
    cliente: "Cliente",
    tecnico: "Técnico",
    administrador: "Administrador",
  };
  const roleIcon: Record<string, React.ReactNode> = {
    cliente: <UserCircleIcon className="w-4 h-4" />,
    tecnico: <WrenchScrewdriverIcon className="w-4 h-4" />,
    administrador: <ShieldCheckIcon className="w-4 h-4" />,
  };

  const role: string = user?.role ?? "";

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Overlay móvil */}
      {isExpanded && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Botón toggle */}
      <button
        onClick={handleToggle}
        className={`fixed top-4 z-50 p-2 rounded-lg bg-slate-900 text-white shadow-lg transition-all duration-300 hover:bg-slate-800 ${
          isExpanded
            ? isMobile
              ? "left-64"
              : "left-56"
            : "left-4"
        } md:left-4`}
      >
        {isExpanded ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white z-40 transition-all duration-500 ease-in-out shadow-xl ${
          isExpanded ? "w-64 md:w-56" : "w-20"
        } ${isMobile && !isExpanded ? "-translate-x-full" : ""}`}
        onMouseEnter={() => {
          if (isHoverEnabled && !isMobile) setIsExpanded(true);
        }}
        onMouseLeave={() => {
          if (isHoverEnabled && !isMobile) setIsExpanded(false);
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg flex-shrink-0">
                <WrenchScrewdriverIcon className="w-6 h-6" />
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
                }`}
              >
                <h1 className="text-xl font-bold whitespace-nowrap">
                  HelpDesk
                </h1>
                {user && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                    {roleIcon[role] ?? <UserCircleIcon className="w-4 h-4" />}
                    <span>{roleLabel[role] ?? role}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navegación */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">

              {/* ── CLIENTE ─────────────────────────────────── */}
              {role === "cliente" && (
                <>
                  <NavLink
                    to="/client/tickets"
					end
                    className={({ isActive }) =>
                      `${linkClass} ${isActive ? activeClass : inactiveClass}`
                    }
                    title="Mis Tickets"
                  >
                    <TicketIcon className="w-5 h-5 flex-shrink-0" />
                    <span
                      className={`transition-all duration-300 whitespace-nowrap ${
                        isExpanded
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-4 absolute"
                      }`}
                    >
                      Mis Tickets
                    </span>
                  </NavLink>

                  <NavLink
                    to="/client/tickets/new"
                    className={({ isActive }) =>
                      `${linkClass} ${isActive ? activeClass : inactiveClass}`
                    }
                    title="Nuevo Ticket"
                  >
                    <PlusCircleIcon className="w-5 h-5 flex-shrink-0" />
                    <span
                      className={`transition-all duration-300 whitespace-nowrap ${
                        isExpanded
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-4 absolute"
                      }`}
                    >
                      Nuevo Ticket
                    </span>
                  </NavLink>
                </>
              )}

              {/* ── TÉCNICO ─────────────────────────────────── */}
              {role === "tecnico" && (
                <>
                  <NavLink
                    to="/tecnico/assignments"
                    className={({ isActive }) =>
                      `${linkClass} ${isActive ? activeClass : inactiveClass}`
                    }
                    title="Asignar Tickets"
                  >
                    <WrenchScrewdriverIcon className="w-5 h-5 flex-shrink-0" />
                    <span
                      className={`transition-all duration-300 whitespace-nowrap ${
                        isExpanded
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-4 absolute"
                      }`}
                    >
                      Asignar Tickets
                    </span>
                  </NavLink>
                  
                  <NavLink
                    to="/tecnico/tickets"
                    className={({ isActive }) =>
                      `${linkClass} ${isActive ? activeClass : inactiveClass}`
                    }
                    title="Tickets Asignados"
                  >
                    <ClipboardDocumentListIcon className="w-5 h-5 flex-shrink-0" />
                    <span
                      className={`transition-all duration-300 whitespace-nowrap ${
                        isExpanded
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-4 absolute"
                      }`}
                    >
                      Tickets Asignados
                    </span>
                  </NavLink>
                </>
              )}

              {/* ── ADMINISTRADOR ───────────────────────────── */}
              {role === "administrador" && (
                <>
                  <NavLink
                    to="/admin/users"
                    className={({ isActive }) =>
                      `${linkClass} ${isActive ? activeClass : inactiveClass}`
                    }
                    title="Usuarios"
                  >
                    <UsersIcon className="w-5 h-5 flex-shrink-0" />
                    <span
                      className={`transition-all duration-300 whitespace-nowrap ${
                        isExpanded
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-4 absolute"
                      }`}
                    >
                      Usuarios
                    </span>
                  </NavLink>

                  <NavLink
                    to="/admin/tickets"
                    className={({ isActive }) =>
                      `${linkClass} ${isActive ? activeClass : inactiveClass}`
                    }
                    title="Tickets"
                  >
                    <TicketIcon className="w-5 h-5 flex-shrink-0" />
                    <span
                      className={`transition-all duration-300 whitespace-nowrap ${
                        isExpanded
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-4 absolute"
                      }`}
                    >
                      Tickets
                    </span>
                  </NavLink>

                  <NavLink
                    to="/admin/assignments"
                    className={({ isActive }) =>
                      `${linkClass} ${isActive ? activeClass : inactiveClass}`
                    }
                    title="Asignaciones"
                  >
                    <WrenchScrewdriverIcon className="w-5 h-5 flex-shrink-0" />
                    <span
                      className={`transition-all duration-300 whitespace-nowrap ${
                        isExpanded
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-4 absolute"
                      }`}
                    >
                      Asignaciones
                    </span>
                  </NavLink>

                  <NavLink
                    to="/admin/workload"
                    className={({ isActive }) =>
                      `${linkClass} ${isActive ? activeClass : inactiveClass}`
                    }
                    title="Carga de Trabajo"
                  >
                    <ChartBarIcon className="w-5 h-5 flex-shrink-0" />
                    <span
                      className={`transition-all duration-300 whitespace-nowrap ${
                        isExpanded
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-4 absolute"
                      }`}
                    >
                      Carga de Trabajo
                    </span>
                  </NavLink>
                </>
              )}
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`${linkClass} w-full text-red-300 hover:bg-red-500/20 hover:text-red-100 disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Cerrar sesión"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
              <span
                className={`transition-all duration-300 whitespace-nowrap ${
                  isExpanded
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-4 absolute"
                }`}
              >
                {isLoggingOut ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin"></div>
                    Cerrando...
                  </span>
                ) : (
                  "Cerrar sesión"
                )}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <main
        className={`flex-1 min-h-screen transition-all duration-500 ease-in-out p-6 ${
          isExpanded ? "md:ml-56 ml-0" : "md:ml-20 ml-0"
        } ${isMobile && isExpanded ? "opacity-50" : ""}`}
      >
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default NavBar;
