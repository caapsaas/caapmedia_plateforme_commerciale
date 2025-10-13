import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from './i18n';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';

// Créer une instance du client

const queryClient = new QueryClient()

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("L'élément racine est introuvable.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AppProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </AppProvider>
      </I18nProvider>
    </QueryClientProvider>
  </React.StrictMode>
);