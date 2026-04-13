import { createBrowserRouter } from "react-router-dom";

import PrivateRoute       from "./PrivateRoute";
import PublicRoute        from "./PublicRoute";
import NavBar             from "../components/NavBar";
import Login              from "../pages/auth/Login";
import Register           from "../pages/auth/Register";
import AdminRestaurants   from "../pages/admin/AdminRestaurants";
import AdminUsers         from "../pages/admin/AdminUsers";
import AdminMenus         from "../pages/admin/AdminMenus";
import AdminOrders        from "../pages/admin/AdminOrders";
import AdminReembolso     from "../pages/admin/AdminReembolso";
import AdminCoupons       from "../pages/admin/AdminCoupons";
import HomeCatalog        from "../pages/client/HomeCatalog";
import RestaurantMenu     from "../pages/client/RestaurantMenu";
import MyOrders           from "../pages/client/MyOrders";
import MyWallet           from "../pages/client/MyWallet";
import MyPayments         from "../pages/client/MyPayments";
import IncomingOrders     from "../pages/restaurant/IncomingOrders";
import ManageMenu         from "../pages/restaurant/ManageMenu";
import AvailableDeliveries from "../pages/delivery/AvailableDeliveries";
import ActiveDelivery     from "../pages/delivery/ActiveDelivery";
import NotFound           from "../pages/errors/NotFound";
import Unauthorized       from "../pages/errors/Unauthorized";

export const RouterApp = createBrowserRouter([
  {
    path: "/",
    element: <NavBar />,
    errorElement: <NotFound />,
    children: [
      // ── CLIENTE ────────────────────────────────────────────
      {
        index: true,
        element: (
          <PrivateRoute roles={['CLIENTE']}>
            <HomeCatalog />
          </PrivateRoute>
        ),
      },
      {
        path: "client/restaurants/:id",
        element: (
          <PrivateRoute roles={['CLIENTE']}>
            <RestaurantMenu />
          </PrivateRoute>
        ),
      },
      {
        path: "client/orders",
        element: (
          <PrivateRoute roles={['CLIENTE']}>
            <MyOrders />
          </PrivateRoute>
        ),
      },
      // ── Nuevas rutas de pagos (CLIENTE) ───────────────────
      {
        path: "client/wallet",
        element: (
          <PrivateRoute roles={['CLIENTE']}>
            <MyWallet />
          </PrivateRoute>
        ),
      },
      {
        path: "client/payments",
        element: (
          <PrivateRoute roles={['CLIENTE']}>
            <MyPayments />
          </PrivateRoute>
        ),
      },

      // ── ADMINISTRADOR ──────────────────────────────────────
      {
        path: "admin/restaurants",
        element: (
          <PrivateRoute roles={['ADMINISTRADOR']}>
            <AdminRestaurants />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <PrivateRoute roles={['ADMINISTRADOR']}>
            <AdminUsers />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/menus",
        element: (
          <PrivateRoute roles={['ADMINISTRADOR']}>
            <AdminMenus />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/orders",
        element: (
          <PrivateRoute roles={['ADMINISTRADOR']}>
            <AdminOrders />
          </PrivateRoute>
        ),
      },
      // ── Nueva ruta de cupones (ADMIN) ─────────────────────
      {
        path: "admin/coupons",
        element: (
          <PrivateRoute roles={['ADMINISTRADOR']}>
            <AdminCoupons />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/reembolso",
        element: (
          <PrivateRoute roles={['ADMINISTRADOR']}>
            <AdminReembolso />
          </PrivateRoute>
        )
      },

      // ── RESTAURANTE ────────────────────────────────────────
      {
        path: "restaurant/orders",
        element: (
          <PrivateRoute roles={['RESTAURANTE']}>
            <IncomingOrders />
          </PrivateRoute>
        ),
      },
      {
        path: "restaurant/menu",
        element: (
          <PrivateRoute roles={['RESTAURANTE']}>
            <ManageMenu />
          </PrivateRoute>
        ),
      },

      // ── REPARTIDOR ─────────────────────────────────────────
      {
        path: "delivery/available",
        element: (
          <PrivateRoute roles={['REPARTIDOR']}>
            <AvailableDeliveries />
          </PrivateRoute>
        ),
      },
      {
        path: "delivery/active",
        element: (
          <PrivateRoute roles={['REPARTIDOR']}>
            <ActiveDelivery />
          </PrivateRoute>
        ),
      },

      // ── ERRORES ────────────────────────────────────────────
      { path: "unauthorized", element: <Unauthorized /> },
    ],
  },

  // ── PUBLIC ─────────────────────────────────────────────────
  { path: "/login",    element: <PublicRoute><Login /></PublicRoute> },
  { path: "/register", element: <PublicRoute><Register /></PublicRoute> },
]);
