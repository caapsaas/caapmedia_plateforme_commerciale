
import React from 'react';
import { Link } from '@tanstack/react-router';
import { View, UserRole } from '../types';
import IconAnalytics from '../components/icons/IconAnalytics';
import IconSales from '../components/icons/IconSales';
import IconStock from '../components/icons/IconStock';
import IconAi from '../components/icons/IconAi';
import IconCrm from '../components/icons/IconCrm';
import IconCashRegister from '../components/icons/IconCashRegister';
import IconMyOrders from '../components/icons/IconMyOrders';
import IconFinance from '../components/icons/IconFinance';
import IconLogout from '../components/icons/IconLogout';
import IconSettings from '../components/icons/IconSettings';
import IconChevronDoubleLeft from '../components/icons/IconChevronDoubleLeft';
import IconBriefcase from '../components/icons/IconBriefcase';
import { useI18n } from '../i18n';
import IconClipboardList from '../components/icons/IconClipboardList';
import IconTruck from '../components/icons/IconTruck';
import IconFactory from '../components/icons/IconFactory';
import IconMaintenance from '../components/icons/IconMaintenance';
import { useAppContext } from '../context/AppContext';
import IconBuildingStorefront from '../components/icons/IconBuildingStorefront';
import { useAuth } from '../context/AuthContext';
import IconGmoLogo from '../components/icons/IconGmoLogo'; // Assumons que c'est le logo par défaut ou un des logos
// Ajoutez ici les autres importations de logos, par exemple : import IconAutreLogo from '../components/icons/IconAutreLogo';

const NavLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  onClick?: () => void;
  exact?: boolean; // ✅ Ajouter la prop `exact`
}> = ({ to, icon, label, isCollapsed, onClick }) => (
  <div className="relative group">
    <Link
      to={to}
      onClick={onClick}
      className={`w-full flex items-center space-x-3 py-3 rounded-lg transition-all duration-200 group ${
        isCollapsed ? 'justify-center px-3' : 'px-4'
      }`}
      activeProps={{ className: 'bg-[#c6e911] text-gray-800  shadow-lg' }}
      inactiveProps={{ className: 'text-[#C6E911] hover:bg-gray-700 hover:text-white' }}
      activeOptions={{ exact: to === '/dashboard/' }} // ✅ Utiliser `exact: true` uniquement pour la racine du dashboard
    >
      {icon}
      <span className={`font-medium whitespace-nowrap ${isCollapsed ? 'hidden' : 'block'}`}>{label}</span>
    </Link>
    {isCollapsed && (
      <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg
        opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50">
        {label}
      </div>
    )}
  </div>
);

const Sidebar: React.FC = () => {
  const { t } = useI18n();
  const { state, dispatch } = useAppContext();
  const { user, subsidiary, logout: authLogout } = useAuth();
  const { isSidebarOpen, isSidebarCollapsed , previewRole } = state;
  const activeRole = previewRole ?? user?.userRole;
 
  // Pour l'admin, on ne cache jamais le sidebar même si subsidiary est temporairement null
// car l'admin doit pouvoir voir tout le contenu de l'application
if (!user || (!subsidiary && user.userRole !== UserRole.ADMIN)) return null;

  const onLogout = () => authLogout();
  const setIsSidebarOpen = (isOpen: boolean) => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: isOpen });
  const setIsSidebarCollapsed = (isCollapsed: boolean) => dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: isCollapsed });

  const getNavItems = () => {
    switch (activeRole) {
      case UserRole.ADMIN:
        return [ // Le `exact: true` sera appliqué automatiquement par la nouvelle logique dans NavLink
          { to: '/dashboard/', label: t('sidebar.analytics'), icon: <IconAnalytics className="h-6 w-6 shrink-0 " /> },
          { to: '/dashboard/crm', label: t('sidebar.crm'), icon: <IconCrm className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/sales', label: t('sidebar.orders'), icon: <IconSales className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/production', label: t('sidebar.production'), icon: <IconFactory className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/maintenance', label: t('sidebar.maintenance'), icon: <IconMaintenance className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/equipements', label: t('sidebar.equipements'), icon: <IconBuildingStorefront className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/purchasing', label: t('sidebar.purchasing'), icon: <IconTruck className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/stock', label: t('sidebar.stockManagement'), icon: <IconStock className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/finance', label: t('sidebar.finance'), icon: <IconFinance className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/hr', label: t('sidebar.hrManagement'), icon: <IconBriefcase className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/secretariat', label: t('sidebar.secretariat'), icon: <IconClipboardList className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/configuration', label: t('sidebar.configuration'), icon: <IconSettings className="h-6 w-6 shrink-0" /> },
        ];
      case UserRole.COMMERCIAL:
        return [
          { to: '/dashboard/', label: t('sidebar.analytics'), icon: <IconAnalytics className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/crm', label: t('sidebar.crm'), icon: <IconCrm className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/sales', label: t('sidebar.orders'), icon: <IconSales className="h-6 w-6 shrink-0" /> },
        ];
      case UserRole.CAISSIER:
        return [
          { to: '/dashboard/caisse', label: t('sidebar.cashRegister'), icon: <IconCashRegister className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/sales', label: t('sidebar.transactions'), icon: <IconSales className="h-6 w-6 shrink-0" /> },
        ];
      case UserRole.PURCHASING_MANAGER:
        return [
          { to: '/dashboard/purchasing', label: t('sidebar.purchasing'), icon: <IconTruck className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/stock', label: t('sidebar.stockManagement'), icon: <IconStock className="h-6 w-6 shrink-0" /> },
        ];
      case UserRole.FINANCIAL_DIRECTOR:
        return [
          { to: '/dashboard/', label: t('sidebar.analytics'), icon: <IconAnalytics className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/crm', label: t('sidebar.crm'), icon: <IconCrm className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/sales', label: t('sidebar.orders'), icon: <IconSales className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/purchasing', label: t('sidebar.purchasing'), icon: <IconTruck className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/finance', label: t('sidebar.finance'), icon: <IconFinance className="h-6 w-6 shrink-0" /> },
        ];
      case UserRole.SECRETARY:
        return [
          { to: '/dashboard/secretariat', label: t('sidebar.secretariat'), icon: <IconClipboardList className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/crm', label: t('sidebar.crm'), icon: <IconCrm className="h-6 w-6 shrink-0" /> },
        ];
      case UserRole.HR_MANAGER:
        return [
          { to: '/dashboard/hr', label: t('sidebar.hrManagement'), icon: <IconBriefcase className="h-6 w-6 shrink-0" /> },
        ];
      case UserRole.PRODUCTION_DIRECTOR:
        return [
          { to: '/dashboard/production', label: t('sidebar.production'), icon: <IconFactory className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/maintenance', label: t('sidebar.maintenance'), icon: <IconMaintenance className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/equipements', label: t('sidebar.equipements'), icon: <IconBuildingStorefront className="h-6 w-6 shrink-0" /> },
          { to: '/dashboard/sales', label: t('sidebar.orders'), icon: <IconSales className="h-6 w-6 shrink-0" /> },
        ];
      default:
        return [];
    }
  };
  
  const navItems = getNavItems();
  
  // Logique pour sélectionner le bon composant de logo
  const getLogoComponent = () => {
    // Remplacez 'GMO' par la valeur réelle du nom de la filiale si nécessaire
    if (subsidiary?.name?.includes('Douala')) {
      return IconGmoLogo;
    }
    // Ajoutez d'autres conditions pour d'autres filiales
    return IconGmoLogo; // Un logo par défaut
  };
  const LogoComponent = getLogoComponent();
  const sidebarClasses = `
    bg-[#231F20] text-white flex flex-col transition-all duration-300 ease-in-out
    md:relative md:translate-x-0
    fixed h-full inset-y-0 left-0 z-40
    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    ${isSidebarCollapsed ? 'w-20' : 'w-64'}
  `;

  return (
    <div className={`no-print`}>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <div className={sidebarClasses}>
        <div className={`flex flex-col items-center justify-center text-center transition-all duration-300 ${isSidebarCollapsed ? 'p-2' : 'p-4'} mb-6`}>
            <div className={`w-auto transition-all duration-300 ${isSidebarCollapsed ? 'h-10' : 'h-16'}`}>
                <LogoComponent className="w-full h-full" />
            </div>
            <span className={`font-bold text-lg mt-2 transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 h-0 hidden' : 'opacity-100 block'}`}>
              {subsidiary?.name || subsidiary?.subsidiaryName || (user.userRole === UserRole.ADMIN ? t('sidebar.adminView') : t('sidebar.noViewForRole'))}
            </span>
        </div>

        <div className="flex-1 flex flex-col justify-between overflow-y-auto overflow-x-hidden">
            <nav className={`space-y-2 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
            {navItems.length > 0 ? navItems.map((item) => (
                <NavLink
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isCollapsed={isSidebarCollapsed}
                onClick={() => setIsSidebarOpen(false)}
                />
            )) : (
                <div className="p-4 text-gray-400">{t('sidebar.noViewForRole')}</div>
            )}
            </nav>
            
            <div className="mt-4">
              <div className={`border-t border-gray-600 ${isSidebarCollapsed ? 'mx-2 pt-2' : 'mx-4 pt-4'}`}>
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="w-full hidden md:flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-400 hover:bg-gray-700 hover:text-white"
                  aria-label={isSidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
                >
                  <IconChevronDoubleLeft className={`h-6 w-6 shrink-0 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
                  <span className={`font-medium whitespace-nowrap ${isSidebarCollapsed ? 'hidden' : 'block'}`}>{t('sidebar.collapse')}</span>
                </button>

                <NavLink
                    to="/login" // Ou une autre route appropriée
                    icon={<IconLogout className="h-6 w-6 shrink-0" />}
                    label={t('common.logout')}
                    isCollapsed={isSidebarCollapsed}
                    onClick={onLogout}
                />
              </div>

              <div className={`mt-2 p-2 text-center text-gray-400 text-xs transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 h-0 hidden' : 'opacity-100 block'}`}>
                  <p>&copy; 2024 CaapMedia</p>
                  <p>{t('common.version')} 2.0.0</p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
