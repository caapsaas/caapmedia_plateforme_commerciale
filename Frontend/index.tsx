import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from './i18n';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { createMyRouter } from './router';

// Créer une instance du client

const queryClient = new QueryClient()

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("L'élément racine est introuvable.");
}

const Root = () => {
  // On récupère le contexte d'authentification ici
  const auth = useAuth();
  
  // On crée l'instance du routeur en lui passant le contexte d'authentification
  const router = createMyRouter(auth);
  
  return <RouterProvider router={router} />;
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AppProvider>
          {/* AuthProvider doit englober le composant qui utilise useAuth */}
          <AuthProvider>
            <Root />
          </AuthProvider>
        </AppProvider>
      </I18nProvider>
    </QueryClientProvider>
  </React.StrictMode>
);