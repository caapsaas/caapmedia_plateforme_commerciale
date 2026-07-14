import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useRouterState } from '@tanstack/react-router';
import { UserRole } from '../types';
import IconAnalytics from '../components/icons/IconAnalytics';
import IconSales from '../components/icons/IconSales';
import IconStock from '../components/icons/IconStock';
import IconCrm from '../components/icons/IconCrm';
import IconCashRegister from '../components/icons/IconCashRegister';
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
import IconAccounting from '../components/icons/IconAccounting';
import { useAuth } from '../context/AuthContext';
import IconGmoLogo from '../components/icons/IconGmoLogo';
import SidebarDropdown from '../components/common/SidebarDropdown';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  groupLabel: string;
  groupIcon: React.ReactNode;
  items: NavItem[];
}

// ─── NavLink (item unique hors dropdown, ex: bouton déconnexion) ─────────────
// Port fidele de Frontend_GMO/components/Sidebar.tsx::NavLink, seule la
// couleur d'accent change (#c6e911 au lieu du gradient orange de gmo).

const NavLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}> = ({ to, icon, label, isActive, isCollapsed, onClick }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  const handleMouseEnter = () => {
    if (isCollapsed && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setTooltipPos({ top: rect.top + rect.height / 2, left: rect.right + 8 });
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Link
        to={to}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setTooltipPos(null)}
        className={`w-full flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 ease-in-out ${
          isCollapsed ? 'justify-center px-0' : 'px-4'
        } ${
          isActive
            ? 'bg-gradient-to-r from-[#c6e911] to-[#a8c70e] text-slate-900 font-semibold shadow-lg shadow-lime-500/20'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        <span className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{icon}</span>
        {!isCollapsed && <span className="text-sm font-medium tracking-wide whitespace-nowrap">{label}</span>}
      </Link>

      {isCollapsed && tooltipPos && createPortal(
        <div
          style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translateY(-50%)' }}
          className="fixed z-[9999] px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap border border-white/10 pointer-events-none"
        >
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>,
        document.body
      )}
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar: React.FC = () => {
  const { t } = useI18n();
  const { state, dispatch } = useAppContext();
  const { user, subsidiary, logout: authLogout } = useAuth();
  const { isSidebarOpen, isSidebarCollapsed, previewRole } = state;
  const activeRole = previewRole ?? user?.userRole;
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  if (!user || (!subsidiary && user.userRole !== UserRole.ADMIN && user.userRole !== UserRole.SUPER_ADMIN)) return null;

  const setIsSidebarOpen = (v: boolean) => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: v });
  const setIsSidebarCollapsed = (v: boolean) => dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: v });

  const getNavGroups = (): NavGroup[] => {
    switch (activeRole) {
      // SUPER_ADMIN voit exactement les memes vues qu'ADMIN (memes routes
      // /dashboard/*) - seule la donnee affichee differe (consolidee toutes
      // filiales au lieu de la filiale de l'utilisateur), resolu cote backend
      // via subsidiary-scope.ts, pas par une page dediee.
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        return [
          {
            groupLabel: 'Principal',
            groupIcon: <IconAnalytics className="h-5 w-5" />,
            items: [
              { to: '/dashboard/', label: t('sidebar.analytics'), icon: <IconAnalytics className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Commerce',
            groupIcon: <IconCrm className="h-5 w-5" />,
            items: [
              { to: '/dashboard/crm', label: t('sidebar.crm'), icon: <IconCrm className="h-5 w-5" /> },
              { to: '/dashboard/sales', label: t('sidebar.orders'), icon: <IconSales className="h-5 w-5" /> },
              { to: '/dashboard/production', label: t('sidebar.production'), icon: <IconFactory className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Opérations',
            groupIcon: <IconTruck className="h-5 w-5" />,
            items: [
              { to: '/dashboard/purchasing', label: t('sidebar.purchasing'), icon: <IconTruck className="h-5 w-5" /> },
              { to: '/dashboard/stock', label: t('sidebar.stockManagement'), icon: <IconStock className="h-5 w-5" /> },
              { to: '/dashboard/maintenance', label: t('sidebar.maintenance'), icon: <IconMaintenance className="h-5 w-5" /> },
              { to: '/dashboard/equipements', label: t('sidebar.equipements'), icon: <IconBuildingStorefront className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Finance & Comptabilité',
            groupIcon: <IconFinance className="h-5 w-5" />,
            items: [
              { to: '/dashboard/finance', label: t('sidebar.finance'), icon: <IconFinance className="h-5 w-5" /> },
              { to: '/dashboard/accounting', label: 'Comptabilité', icon: <IconAccounting className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'RH & Administration',
            groupIcon: <IconBriefcase className="h-5 w-5" />,
            items: [
              { to: '/dashboard/hr', label: t('sidebar.hrManagement'), icon: <IconBriefcase className="h-5 w-5" /> },
              { to: '/dashboard/secretariat', label: t('sidebar.secretariat'), icon: <IconClipboardList className="h-5 w-5" /> },
              { to: '/dashboard/configuration', label: t('sidebar.configuration'), icon: <IconSettings className="h-5 w-5" /> },
            ],
          },
        ];

      case UserRole.COMMERCIAL:
        return [
          {
            groupLabel: 'Principal',
            groupIcon: <IconAnalytics className="h-5 w-5" />,
            items: [
              { to: '/dashboard/', label: t('sidebar.analytics'), icon: <IconAnalytics className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Commerce',
            groupIcon: <IconCrm className="h-5 w-5" />,
            items: [
              { to: '/dashboard/crm', label: t('sidebar.crm'), icon: <IconCrm className="h-5 w-5" /> },
              { to: '/dashboard/sales', label: t('sidebar.orders'), icon: <IconSales className="h-5 w-5" /> },
            ],
          },
        ];

      case UserRole.CAISSIER:
        return [
          {
            groupLabel: 'Caisse',
            groupIcon: <IconCashRegister className="h-5 w-5" />,
            items: [
              { to: '/dashboard/caisse', label: t('sidebar.cashRegister'), icon: <IconCashRegister className="h-5 w-5" /> },
              { to: '/dashboard/sales', label: t('sidebar.transactions'), icon: <IconSales className="h-5 w-5" /> },
            ],
          },
        ];

      case UserRole.PURCHASING_MANAGER:
        return [
          {
            groupLabel: 'Opérations',
            groupIcon: <IconTruck className="h-5 w-5" />,
            items: [
              { to: '/dashboard/purchasing', label: t('sidebar.purchasing'), icon: <IconTruck className="h-5 w-5" /> },
              { to: '/dashboard/stock', label: t('sidebar.stockManagement'), icon: <IconStock className="h-5 w-5" /> },
            ],
          },
        ];

      case UserRole.FINANCIAL_DIRECTOR:
        return [
          {
            groupLabel: 'Principal',
            groupIcon: <IconAnalytics className="h-5 w-5" />,
            items: [
              { to: '/dashboard/', label: t('sidebar.analytics'), icon: <IconAnalytics className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Commerce',
            groupIcon: <IconCrm className="h-5 w-5" />,
            items: [
              { to: '/dashboard/crm', label: t('sidebar.crm'), icon: <IconCrm className="h-5 w-5" /> },
              { to: '/dashboard/sales', label: t('sidebar.orders'), icon: <IconSales className="h-5 w-5" /> },
              { to: '/dashboard/purchasing', label: t('sidebar.purchasing'), icon: <IconTruck className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Finance & Comptabilité',
            groupIcon: <IconFinance className="h-5 w-5" />,
            items: [
              { to: '/dashboard/finance', label: t('sidebar.finance'), icon: <IconFinance className="h-5 w-5" /> },
              { to: '/dashboard/accounting', label: 'Comptabilité', icon: <IconAccounting className="h-5 w-5" /> },
            ],
          },
        ];

      case UserRole.SECRETARY:
        return [
          {
            groupLabel: 'Secrétariat',
            groupIcon: <IconClipboardList className="h-5 w-5" />,
            items: [
              { to: '/dashboard/secretariat', label: t('sidebar.secretariat'), icon: <IconClipboardList className="h-5 w-5" /> },
              { to: '/dashboard/crm', label: t('sidebar.crm'), icon: <IconCrm className="h-5 w-5" /> },
            ],
          },
        ];

      case UserRole.HR_MANAGER:
        return [
          {
            groupLabel: 'Ressources humaines',
            groupIcon: <IconBriefcase className="h-5 w-5" />,
            items: [
              { to: '/dashboard/hr', label: t('sidebar.hrManagement'), icon: <IconBriefcase className="h-5 w-5" /> },
            ],
          },
        ];

      case UserRole.PRODUCTION_DIRECTOR:
        return [
          {
            groupLabel: 'Production',
            groupIcon: <IconFactory className="h-5 w-5" />,
            items: [
              { to: '/dashboard/production', label: t('sidebar.production'), icon: <IconFactory className="h-5 w-5" /> },
              { to: '/dashboard/sales', label: t('sidebar.orders'), icon: <IconSales className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Maintenance',
            groupIcon: <IconMaintenance className="h-5 w-5" />,
            items: [
              { to: '/dashboard/maintenance', label: t('sidebar.maintenance'), icon: <IconMaintenance className="h-5 w-5" /> },
              { to: '/dashboard/equipements', label: t('sidebar.equipements'), icon: <IconBuildingStorefront className="h-5 w-5" /> },
            ],
          },
        ];

      default:
        return [];
    }
  };

  const navGroups = getNavGroups();
  const subsidiaryName = subsidiary?.name || subsidiary?.subsidiaryName;

  const sidebarClasses = `
    no-print
    fixed md:relative inset-y-0 left-0 z-40
    flex flex-col
    bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]
    text-white
    transition-all duration-300 ease-in-out
    shadow-2xl
    border-r border-white/5
    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    ${isSidebarCollapsed ? 'w-20' : 'w-72'}
  `;

  // Un Fragment (et non un <div> englobant) pour que sidebarClasses soit
  // l'enfant flex DIRECT du conteneur `flex h-screen` d'App.tsx: c'est ce qui
  // lui permet de s'etirer sur toute la hauteur de l'ecran (align-items:
  // stretch par defaut). Un div wrapper intermediaire cassait cet etirement -
  // meme structure que Frontend_GMO/components/Sidebar.tsx.
  return (
    <>
      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className="no-print fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={sidebarClasses}>
        {/* ── Logo ── */}
        <div className={`flex items-center justify-center transition-all duration-300 border-b border-white/10 bg-white/5 backdrop-blur-sm ${isSidebarCollapsed ? 'p-3' : 'p-4'}`}>
          <div className={`bg-white rounded-lg p-2 transition-all duration-300 ${isSidebarCollapsed ? 'h-10 w-10' : 'h-16 w-16'}`}>
            <IconGmoLogo className="w-full h-full" />
          </div>
        </div>

        {/* ── Filiale & rôle ── */}
        {!isSidebarCollapsed && (
          <div className="px-4 py-3 space-y-2">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
              <p className="text-sm font-medium text-slate-200 truncate">
                {subsidiaryName || (user.userRole === UserRole.ADMIN || user.userRole === UserRole.SUPER_ADMIN ? 'Vue Admin' : 'CaapMedia')}
              </p>
            </div>
            {/* Role switcher: affiche des pills si l'utilisateur a des rôles supplémentaires */}
            {(user.additionalRoles ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {[user.userRole, ...(user.additionalRoles ?? [])].filter((r): r is UserRole => !!r).map(role => (
                  <button
                    key={role}
                    onClick={() => dispatch({ type: 'SET_PREVIEW_ROLE', payload: role })}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all duration-150 ${
                      activeRole === role
                        ? 'bg-[#c6e911] text-slate-900 shadow-md'
                        : 'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {role.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            ) : (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#c6e911]/15 text-[#c6e911] tracking-wide uppercase">
                {(user.userRole ?? '').replace(/_/g, ' ')}
              </span>
            )}
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          <nav className={`space-y-1 ${isSidebarCollapsed ? 'px-3' : 'px-4'}`}>
            {navGroups.length > 0 ? (
              navGroups.map((group) => (
                <SidebarDropdown
                  key={group.groupLabel}
                  title={group.groupLabel}
                  icon={group.groupIcon}
                  items={group.items}
                  isCollapsed={isSidebarCollapsed}
                  currentPath={currentPath}
                  onItemClick={() => setIsSidebarOpen(false)}
                />
              ))
            ) : (
              <div className="p-4 text-slate-500 text-sm text-center">{t('sidebar.noViewForRole')}</div>
            )}
          </nav>
        </div>

        {/* ── Footer ── */}
        <div className={`border-t border-white/5 ${isSidebarCollapsed ? 'px-3 py-4' : 'px-4 py-4'} space-y-1`}>
          {/* Bouton collapse (desktop uniquement) */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`hidden md:flex w-full items-center gap-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-200 group ${
              isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
            }`}
            title={isSidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          >
            <IconChevronDoubleLeft
              className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
            />
            {!isSidebarCollapsed && (
              <span className="text-sm font-medium whitespace-nowrap">{t('sidebar.collapse')}</span>
            )}
          </button>

          {/* Déconnexion */}
          <NavLink
            to="/login"
            icon={<IconLogout className="h-5 w-5" />}
            label={t('common.logout')}
            isActive={false}
            isCollapsed={isSidebarCollapsed}
            onClick={() => { setIsSidebarOpen(false); authLogout(); }}
          />

          {!isSidebarCollapsed && (
            <p className="text-center text-[10px] text-slate-600 pt-2">
              CaapMedia &copy; 2024 · v2.0.0
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
