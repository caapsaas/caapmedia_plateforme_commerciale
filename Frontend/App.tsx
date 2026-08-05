import React from 'react';
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
  const isDashboard = routerState.location.pathname.startsWith('/dashboard');

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