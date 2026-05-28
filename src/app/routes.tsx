import { createBrowserRouter } from "react-router";
import Login from "./pages/Login";
import DiagnosticoSistema from "./pages/DiagnosticoSistema";
import ErrorPage from "./pages/ErrorPage";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminClientes from "./pages/admin/Clientes";
import AdminContratos from "./pages/admin/Contratos";
import AdminIntervencoes from "./pages/admin/Intervencoes";
import AdminTecnicos from "./pages/admin/Tecnicos";
import AdminRelatorios from "./pages/admin/Relatorios";
import TecnicoDashboard from "./pages/tecnico/Dashboard";
import TecnicoIntervencoes from "./pages/tecnico/Intervencoes";
import TecnicoHoras from "./pages/tecnico/Horas";
import ClienteDashboard from "./pages/cliente/Dashboard";
import ClienteIntervencoes from "./pages/cliente/Intervencoes";
import ClienteContratos from "./pages/cliente/Contratos";
import AdminLayout from "./layouts/AdminLayout";
import TecnicoLayout from "./layouts/TecnicoLayout";
import ClienteLayout from "./layouts/ClienteLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
    errorElement: <ErrorPage />,
  },
  {
    path: "/diagnostico",
    Component: DiagnosticoSistema,
    errorElement: <ErrorPage />,
  },
  {
    path: "/admin",
    Component: AdminLayout,
    errorElement: <ErrorPage />,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "dashboard", Component: AdminDashboard },
      { path: "clientes", Component: AdminClientes },
      { path: "contratos", Component: AdminContratos },
      { path: "intervencoes", Component: AdminIntervencoes },
      { path: "tecnicos", Component: AdminTecnicos },
      { path: "relatorios", Component: AdminRelatorios },
    ],
  },
  {
    path: "/tecnico",
    Component: TecnicoLayout,
    errorElement: <ErrorPage />,
    children: [
      { index: true, Component: TecnicoDashboard },
      { path: "dashboard", Component: TecnicoDashboard },
      { path: "intervencoes", Component: TecnicoIntervencoes },
      { path: "horas", Component: TecnicoHoras },
    ],
  },
  {
    path: "/cliente",
    Component: ClienteLayout,
    errorElement: <ErrorPage />,
    children: [
      { index: true, Component: ClienteDashboard },
      { path: "dashboard", Component: ClienteDashboard },
      { path: "intervencoes", Component: ClienteIntervencoes },
      { path: "contratos", Component: ClienteContratos },
    ],
  },
]);