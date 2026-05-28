import { RouterProvider } from "react-router";
import { router } from "./routes";
import AuthInitializer from "./components/AuthInitializer";
import ErrorBoundary from "./components/ErrorBoundary";
//import { MigrationHelper } from "./components/MigrationHelper";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    // Detectar erros de importação dinâmica e forçar reload
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || '';
      
      // Detectar erros de módulos dinâmicos
      if (
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('@react-refresh') ||
        errorMessage.includes('dynamically imported')
      ) {
        console.warn('Erro de módulo detectado. Recarregando página...');
        
        // Verificar se já tentamos recarregar
        const reloadKey = 'app_reload_attempted';
        const hasReloaded = sessionStorage.getItem(reloadKey);
        
        if (!hasReloaded) {
          sessionStorage.setItem(reloadKey, 'true');
          window.location.reload();
        } else {
          // Se já recarregamos uma vez, limpar e mostrar erro
          sessionStorage.removeItem(reloadKey);
          console.error('Erro persistente após reload:', errorMessage);
        }
      }
    };

    window.addEventListener('error', handleError);
    
    // Limpar flag de reload ao carregar com sucesso
    sessionStorage.removeItem('app_reload_attempted');

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <AuthInitializer />
    </ErrorBoundary>
  );
}