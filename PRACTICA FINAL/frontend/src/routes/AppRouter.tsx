import { createBrowserRouter } from "react-router-dom";

import PrivateRoute        from "./PrivateRoute";
import PublicRoute         from "./PublicRoute";
import NavBar              from "../components/NavBar";
import Login               from "../pages/auth/Login";
import Register            from "../pages/auth/Register";

// ── CLIENTE ────────────────────────────────────────────────────
import ClientTickets       from "../pages/client/ClientTickets";
import ClientNewTicket     from "../pages/client/ClientNewTicket";
import ClientTicketDetail  from "../pages/client/ClientTicketDetail";

// ── TÉCNICO ────────────────────────────────────────────────────
import TecnicoTickets      from "../pages/technician/TechnicianTickets";
import TecnicoTicketDetail from "../pages/technician/TechnicianTicketDetail";

// ── ADMINISTRADOR ──────────────────────────────────────────────
import AdminUsers          from "../pages/admin/AdminUsers";
import AdminRegisterUser   from "../pages/admin/AdminRegisterUser";
import AdminTickets        from "../pages/admin/AdminTickets";
import AdminAssignments    from "../pages/admin/AdminAssignments";
import AdminWorkload       from "../pages/admin/AdminWorkload";

// ── ERRORES ────────────────────────────────────────────────────
import NotFound            from "../pages/errors/NotFound";
import Unauthorized        from "../pages/errors/Unauthorized";

export const RouterApp = createBrowserRouter([
  {
    path: "/",
    element: <NavBar />,
    errorElement: <NotFound />,
    children: [

      // ── CLIENTE ──────────────────────────────────────────────
      {
        index: true,
        element: (
          <PrivateRoute roles={["cliente"]}>
            <ClientTickets />
          </PrivateRoute>
        ),
      },
      {
        path: "client/tickets",
        element: (
          <PrivateRoute roles={["cliente"]}>
            <ClientTickets />
          </PrivateRoute>
        ),
      },
      {
        path: "client/tickets/new",
        element: (
          <PrivateRoute roles={["cliente"]}>
            <ClientNewTicket />
          </PrivateRoute>
        ),
      },
      {
        path: "client/tickets/:id",
        element: (
          <PrivateRoute roles={["cliente"]}>
            <ClientTicketDetail />
          </PrivateRoute>
        ),
      },

      // ── TÉCNICO ──────────────────────────────────────────────
      {
        path: "tecnico/tickets",
        element: (
          <PrivateRoute roles={["tecnico"]}>
            <TecnicoTickets />
          </PrivateRoute>
        ),
      },
      {
        path: "tecnico/tickets/:id",
        element: (
          <PrivateRoute roles={["tecnico"]}>
            <TecnicoTicketDetail />
          </PrivateRoute>
        ),
      },

      // ── ADMINISTRADOR ─────────────────────────────────────────
      {
        path: "admin/users",
        element: (
          <PrivateRoute roles={["administrador"]}>
            <AdminUsers />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/users/register",
        element: (
          <PrivateRoute roles={["administrador"]}>
            <AdminRegisterUser />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/tickets",
        element: (
          <PrivateRoute roles={["administrador"]}>
            <AdminTickets />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/assignments",
        element: (
          <PrivateRoute roles={["administrador"]}>
            <AdminAssignments />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/workload",
        element: (
          <PrivateRoute roles={["administrador"]}>
            <AdminWorkload />
          </PrivateRoute>
        ),
      },

      // ── ERRORES ───────────────────────────────────────────────
      { path: "unauthorized", element: <Unauthorized /> },
    ],
  },

  // ── PUBLIC ───────────────────────────────────────────────────
  { path: "/login",    element: <PublicRoute><Login /></PublicRoute> },
  { path: "/register", element: <PublicRoute><Register /></PublicRoute> },
]);
