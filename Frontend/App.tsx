import React, { useEffect } from 'react';
import Sidebar from './Pages/Sidebar';
import Header from './Pages/Header';
import useIdleTimer from './hooks/useIdleTimer';
import IdleTimeoutModal from './components/common/IdleTimeoutModal';
import './styles/print.css';
import { useAppContext } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Outlet, useRouterState, useNavigate } from '@tanstack/react-router';

const App: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { showIdleModal } = state;
  const { logout, isAuthenticated } = useAuth();
  const routerState = useRouterState();
  const navigate = useNavigate();
  const pathname = routerState.location.pathname;
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/';
  const isDashboard = pathname.startsWith('/dashboard');

  useEffect(() => {
    const publicPages: Record<string, { title: string; description: string }> = {
      '/': {
        title: 'Imprimerie à Douala, supports publicitaires et objets personnalisés | CaapMedia',
        description: 'CaapMedia accompagne les entreprises de Douala dans leurs projets d’impression, de communication visuelle et de supports personnalisés. Découvrez nos services et demandez un devis.',
      },
      '/realisations': {
        title: 'Réalisations et prestations d’imprimerie à Douala | CaapMedia',
        description: 'Découvrez les prestations de CaapMedia : impression numérique et grand format, design graphique, sérigraphie, broderie et communication visuelle à Douala.',
      },
    };
    const page = publicPages[normalizedPathname];
    const ensureMeta = (selector: string, attributes: Record<string, string>) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        document.head.appendChild(element);
      }
      Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value));
      return element;
    };

    document.title = page?.title ?? 'CaapMedia | Espace client';
    ensureMeta('meta[name="description"]', {
      name: 'description',
      content: page?.description ?? 'Espace de connexion et de gestion CaapMedia.',
    });
    ensureMeta('meta[name="robots"]', {
      name: 'robots',
      content: page ? 'index,follow' : 'noindex,nofollow',
    });
    ensureMeta('meta[property="og:title"]', {
      property: 'og:title',
      content: page?.title ?? 'CaapMedia | Espace client',
    });
    ensureMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: page?.description ?? 'Espace de connexion et de gestion CaapMedia.',
    });

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (page) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = `https://caapmedia.com${normalizedPathname === '/' ? '/' : normalizedPathname}`;
      ensureMeta('meta[property="og:url"]', {
        property: 'og:url',
        content: canonical.href,
      });
    } else {
      canonical?.remove();
      document.head.querySelector('meta[property="og:url"]')?.remove();
    }
  }, [normalizedPathname]);

  const handleLogout = () => {
    logout();
    // logout() ne fait que vider l'etat auth - il faut naviguer
    // explicitement vers /login (voir meme correctif dans Header.tsx).
    navigate({ to: '/login', replace: true });
  };

  const handleIdle = () => {
    if (isDashboard && isAuthenticated) {
      dispatch({ type: 'SET_IDLE_MODAL', payload: true });
    }
  };

  const { reset: resetIdleTimer } = useIdleTimer({ onIdle: handleIdle, timeout: 1000 * 60 * 15 }); // 15 minutes timeout

  const handleStayLoggedIn = () => {
    dispatch({ type: 'SET_IDLE_MODAL', payload: false });
    resetIdleTimer();
  };

  // Si c'est une route du dashboard, on affiche le layout complet
  if (isDashboard) {
    return (
      <ToastProvider>
        <div className="flex h-screen bg-gray-100 text-slate-800">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8">
              <div className="printable-area">
                <Outlet />
              </div>
            </main>
          </div>
          <IdleTimeoutModal
            isOpen={showIdleModal}
            onLogout={handleLogout}
            onStayLoggedIn={handleStayLoggedIn}
          />
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <Outlet />
    </ToastProvider>
  );
};

export default App;
