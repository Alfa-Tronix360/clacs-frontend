import { RouterProvider } from "react-router";
import { router } from "./routes";
import AuthInitializer from "./components/AuthInitializer";
import ErrorBoundary from "./components/ErrorBoundary";
import { useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

export default function App() {
  // ✅ Keep-alive — faz ping ao backend a cada 10 minutos para evitar cold start
  useEffect(() => {
    const ping = () => {
      fetch(`${API_BASE_URL}/`)
        .then(() => console.log("[Keep-alive] Backend activo"))
        .catch(() => console.warn("[Keep-alive] Backend não respondeu"));
    };

    // Faz ping imediatamente ao carregar e depois a cada 10 minutos
    ping();
    const intervalo = setInterval(ping, 10 * 60 * 1000);

    return () => clearInterval(intervalo);
  }, []);

  // Detectar erros de importação dinâmica e forçar reload
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || "";

      if (
        errorMessage.includes("Failed to fetch dynamically imported module") ||
        errorMessage.includes("@react-refresh") ||
        errorMessage.includes("dynamically imported")
      ) {
        console.warn("Erro de módulo detectado. Recarregando página...");

        const reloadKey = "app_reload_attempted";
        const hasReloaded = sessionStorage.getItem(reloadKey);

        if (!hasReloaded) {
          sessionStorage.setItem(reloadKey, "true");
          window.location.reload();
        } else {
          sessionStorage.removeItem(reloadKey);
          console.error("Erro persistente após reload:", errorMessage);
        }
      }
    };

    window.addEventListener("error", handleError);
    sessionStorage.removeItem("app_reload_attempted");

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <AuthInitializer />
    </ErrorBoundary>
  );
}
