import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import useIdleTimer from './hooks/useIdleTimer';
import IdleTimeoutModal from './components/common/IdleTimeoutModal';
import { useAppContext } from './context/AppContext';
import { Outlet, useRouterState } from '@tanstack/react-router';

const App: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { 
    currentSubsidiary, showIdleModal
  } = state;
  const routerState = useRouterState();
  const isDashboard = routerState.location.pathname.startsWith('/dashboard');

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const handleIdle = () => {
    if (isDashboard && currentSubsidiary) {
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
    );
  }

  // Pour les autres routes (publiques), on affiche juste le contenu de la route
  return (
    <Outlet />
  );
};

export default App;