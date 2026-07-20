import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from './i18n';
import { AppProvider, useAppContext } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { createMyRouter } from './router';
import LoadingOverlay from './components/common/LoadingOverlay';
import { useHttpLoading } from './hooks/useHttpLoading';

// Créer une instance du client

const queryClient = new QueryClient()

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("L'élément racine est introuvable.");
}

// Component to initialize HTTP loading interceptors
const HttpLoadingInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useHttpLoading();
  return <>{children}</>;
};

const Root = () => {
  // On récupère le contexte d'authentification ici
  const auth = useAuth();
  // ✅ On récupère également le contexte de l'application
  const app = useAppContext();

  // On crée l'instance du routeur en lui passant les deux contextes
  const router = createMyRouter(auth, app);

  return <RouterProvider router={router} />;
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LoadingProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AppProvider>
            {/* AuthProvider doit englober le composant qui utilise useAuth */}
            <AuthProvider>
              <HttpLoadingInitializer>
                <LoadingOverlay />
                <Root />
              </HttpLoadingInitializer>
            </AuthProvider>
          </AppProvider>
        </I18nProvider>
      </QueryClientProvider>
      </LoadingProvider>
  </React.StrictMode>
);