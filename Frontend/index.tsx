import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n';
import { AppProvider } from './context/AppContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("L'élément racine est introuvable.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <I18nProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </I18nProvider>
  </React.StrictMode>
);