
import React from 'react';
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

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, isCollapsed, onClick }) => (
  <div className="relative group">
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 py-3 rounded-lg transition-all duration-200 ${
        isCollapsed ? 'justify-center px-3' : 'px-4'
      } ${
        isActive
          ? 'bg-[#c6e911] text-slate-800 shadow-lg'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {icon}
      <span className={`font-medium whitespace-nowrap ${isCollapsed ? 'hidden' : 'block'}`}>{label}</span>
    </button>
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
  const { currentUser, currentSubsidiary, isSidebarOpen, isSidebarCollapsed } = state;

  if (!currentUser || !currentSubsidiary) return null;

  const onLogout = () => dispatch({ type: 'LOGOUT' });
  const setCurrentView = (view: View) => dispatch({ type: 'SET_VIEW', payload: view });
  const setIsSidebarOpen = (isOpen: boolean) => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: isOpen });
  const setIsSidebarCollapsed = (isCollapsed: boolean) => dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: isCollapsed });

  const getNavItems = () => {
    switch (currentUser.role) {
      case UserRole.ADMIN:
        return [
          { view: View.ANALYTICS, label: t('sidebar.analytics'), icon: <IconAnalytics className="h-6 w-6 shrink-0" /> },
          { view: View.CRM, label: t('sidebar.crm'), icon: <IconCrm className="h-6 w-6 shrink-0" /> },
          { view: View.SALES, label: t('sidebar.orders'), icon: <IconSales className="h-6 w-6 shrink-0" /> },
          { view: View.PRODUCTION, label: t('sidebar.production'), icon: <IconFactory className="h-6 w-6 shrink-0" /> },
          { view: View.MAINTENANCE, label: t('sidebar.maintenance'), icon: <IconMaintenance className="h-6 w-6 shrink-0" /> },
          { view: View.EQUIPEMENT, label: t('sidebar.equipements'), icon: <IconBuildingStorefront className="h-6 w-6 shrink-0" /> },
          { view: View.PURCHASING, label: t('sidebar.purchasing'), icon: <IconTruck className="h-6 w-6 shrink-0" /> },
          { view: View.STOCK, label: t('sidebar.stockManagement'), icon: <IconStock className="h-6 w-6 shrink-0" /> },
          { view: View.FINANCE, label: t('sidebar.finance'), icon: <IconFinance className="h-6 w-6 shrink-0" /> },
          { view: View.HR_MANAGEMENT, label: t('sidebar.hrManagement'), icon: <IconBriefcase className="h-6 w-6 shrink-0" /> },
          { view: View.SECRETARIAT, label: t('sidebar.secretariat'), icon: <IconClipboardList className="h-6 w-6 shrink-0" /> },
          { view: View.CONFIGURATION, label: t('sidebar.configuration'), icon: <IconSettings className="h-6 w-6 shrink-0" /> },
          { view: View.AI_MARKETING, label: t('sidebar.aiAssistant'), icon: <IconAi className="h-6 w-6 shrink-0" /> },
        ];
      case UserRole.COMMERCIAL:
        return [
          { view: View.ANALYTICS, label: t('sidebar.analytics'), icon: <IconAnalytics className="h-6 w-6 shrink-0" /> },
          { view: View.CRM, label: t('sidebar.crm'), icon: <IconCrm className="h-6 w-6 shrink-0" /> },
          { view: View.SALES, label: t('sidebar.orders'), icon: <IconSales className="h-6 w-6 shrink-0" /> },
        ];
      case UserRole.CAISSIER:
        return [
          { view: View.CAISSE, label: t('sidebar.cashRegister'), icon: <IconCashRegister className="h-6 w-6 shrink-0" /> },
          { view: View.SALES, label: t('sidebar.transactions'), icon: <IconSales className="h-6 w-6 shrink-0" /> },
        ];
      case UserRole.PURCHASING_MANAGER:
        return [
          { view: View.PURCHASING, label: t('sidebar.purchasing'), icon: <IconTruck className="h-6 w-6 shrink-0" /> },
          { view: View.STOCK, label: t('sidebar.stockManagement'), icon: <IconStock className="h-6 w-6 shrink-0" /> },
        ];
      case UserRole.FINANCIAL_DIRECTOR:
        return [
          { view: View.ANALYTICS, label: t('sidebar.analytics'), icon: <IconAnalytics className="h-6 w-6 shrink-0" /> },
          { view: View.CRM, label: t('sidebar.crm'), icon: <IconCrm className="h-6 w-6 shrink-0" /> },
          { view: View.SALES, label: t('sidebar.orders'), icon: <IconSales className="h-6 w-6 shrink-0" /> },
          { view: View.PURCHASING, label: t('sidebar.purchasing'), icon: <IconTruck className="h-6 w-6 shrink-0" /> },
          { view: View.FINANCE, label: t('sidebar.finance'), icon: <IconFinance className="h-6 w-6 shrink-0" /> },
        ];
      case UserRole.SECRETARY:
        return [
          { view: View.SECRETARIAT, label: t('sidebar.secretariat'), icon: <IconClipboardList className="h-6 w-6 shrink-0" /> },
          { view: View.CRM, label: t('sidebar.crm'), icon: <IconCrm className="h-6 w-6 shrink-0" /> },
        ];
      case UserRole.HR_MANAGER:
        return [
          { view: View.HR_MANAGEMENT, label: t('sidebar.hrManagement'), icon: <IconBriefcase className="h-6 w-6 shrink-0" /> },
        ];
      case UserRole.PRODUCTION_DIRECTOR:
        return [
          { view: View.PRODUCTION, label: t('sidebar.production'), icon: <IconFactory className="h-6 w-6 shrink-0" /> },
          { view: View.MAINTENANCE, label: t('sidebar.maintenance'), icon: <IconMaintenance className="h-6 w-6 shrink-0" /> },
          { view: View.EQUIPEMENT, label: t('sidebar.equipements'), icon: <IconBuildingStorefront className="h-6 w-6 shrink-0" /> },
          { view: View.SALES, label: t('sidebar.orders'), icon: <IconSales className="h-6 w-6 shrink-0" /> },
        ];
      default:
        return [];
    }
  };
  
  const navItems = getNavItems();
  const LogoComponent = currentSubsidiary.logo;
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
            <span className={`font-bold text-lg mt-2 transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 h-0 hidden' : 'opacity-100 block'}`}>{currentSubsidiary.name}</span>
        </div>

        <div className="flex-1 flex flex-col justify-between overflow-y-auto overflow-x-hidden">
            <nav className={`space-y-2 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
            {navItems.length > 0 ? navItems.map((item) => (
                <NavLink
                key={item.view}
                icon={item.icon}
                label={item.label}
                isActive={state.currentView === item.view}
                isCollapsed={isSidebarCollapsed}
                onClick={() => {
                    setCurrentView(item.view);
                    setIsSidebarOpen(false);
                }}
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
                    icon={<IconLogout className="h-6 w-6 shrink-0" />}
                    label={t('common.logout')}
                    isActive={false}
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
