import React, { useState, useRef, useEffect } from 'react';
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

// ─── NavLink ─────────────────────────────────────────────────────────────────

const NavLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  onClick?: () => void;
}> = ({ to, icon, label, isCollapsed, onClick }) => (
  <div className="relative group">
    <Link
      to={to}
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-2.5 rounded-xl transition-all duration-150 ${
        isCollapsed ? 'justify-center px-3' : 'px-3'
      }`}
      activeProps={{ className: 'bg-[#c6e911] text-gray-900 shadow-md font-semibold' }}
      inactiveProps={{ className: 'text-slate-300 hover:bg-white/10 hover:text-white' }}
      activeOptions={{ exact: to === '/dashboard/' }}
    >
      <span className="shrink-0">{icon}</span>
      {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
    </Link>

    {/* Tooltip mode réduit */}
    {isCollapsed && (
      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl
        opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 border border-white/10">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
      </div>
    )}
  </div>
);

// ─── CollapsibleGroup ─────────────────────────────────────────────────────────

const CollapsibleGroup: React.FC<{
  group: NavGroup;
  isCollapsed: boolean;           // sidebar réduite (icônes seulement)
  onItemClick: () => void;
  currentPath: string;
}> = ({ group, isCollapsed, onItemClick, currentPath }) => {
  // Vérifie si un item du groupe est actif pour l'ouvrir par défaut
  const hasActiveItem = group.items.some((item) =>
    item.to === '/dashboard/'
      ? currentPath === '/dashboard/'
      : currentPath.startsWith(item.to)
  );

  const [open, setOpen] = useState(hasActiveItem);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(hasActiveItem ? undefined : 0);

  // Mise à jour de la hauteur pour l'animation
  useEffect(() => {
    if (!contentRef.current) return;
    if (open) {
      setHeight(contentRef.current.scrollHeight);
      // Après l'animation, libérer la hauteur pour gérer les redimensionnements
      const timer = setTimeout(() => setHeight(undefined), 250);
      return () => clearTimeout(timer);
    } else {
      // Figer la hauteur avant de l'animer vers 0
      setHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setHeight(0));
      });
    }
  }, [open]);

  // En mode sidebar réduite, tout est toujours visible (pas de labels, juste les icônes)
  if (isCollapsed) {
    return (
      <div className="space-y-0.5 py-1">
        <div className="mx-3 mb-1 border-t border-white/10" />
        {group.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isCollapsed
            onClick={onItemClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {/* En-tête du groupe cliquable */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 pt-3 pb-1.5 rounded-lg group/header hover:bg-white/5 transition-colors duration-150"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover/header:text-slate-400 transition-colors select-none">
          {group.groupLabel}
        </span>
        <svg
          className={`h-3 w-3 text-slate-500 group-hover/header:text-slate-400 transition-all duration-250 ${open ? 'rotate-180' : 'rotate-0'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Contenu animé */}
      <div
        ref={contentRef}
        style={{ height: height === undefined ? 'auto' : `${height}px` }}
        className="overflow-hidden transition-[height] duration-250 ease-in-out"
      >
        <div className="space-y-0.5 pb-1">
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isCollapsed={false}
              onClick={onItemClick}
            />
          ))}
        </div>
      </div>
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
            items: [
              { to: '/dashboard/', label: t('sidebar.analytics'), icon: <IconAnalytics className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Commerce',
            items: [
              { to: '/dashboard/crm', label: t('sidebar.crm'), icon: <IconCrm className="h-5 w-5" /> },
              { to: '/dashboard/sales', label: t('sidebar.orders'), icon: <IconSales className="h-5 w-5" /> },
              { to: '/dashboard/production', label: t('sidebar.production'), icon: <IconFactory className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Opérations',
            items: [
              { to: '/dashboard/purchasing', label: t('sidebar.purchasing'), icon: <IconTruck className="h-5 w-5" /> },
              { to: '/dashboard/stock', label: t('sidebar.stockManagement'), icon: <IconStock className="h-5 w-5" /> },
              { to: '/dashboard/maintenance', label: t('sidebar.maintenance'), icon: <IconMaintenance className="h-5 w-5" /> },
              { to: '/dashboard/equipements', label: t('sidebar.equipements'), icon: <IconBuildingStorefront className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Finance & Comptabilité',
            items: [
              { to: '/dashboard/finance', label: t('sidebar.finance'), icon: <IconFinance className="h-5 w-5" /> },
              { to: '/dashboard/accounting', label: 'Comptabilité', icon: <IconAccounting className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'RH & Administration',
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
            items: [
              { to: '/dashboard/', label: t('sidebar.analytics'), icon: <IconAnalytics className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Commerce',
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
            items: [
              { to: '/dashboard/', label: t('sidebar.analytics'), icon: <IconAnalytics className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Commerce',
            items: [
              { to: '/dashboard/crm', label: t('sidebar.crm'), icon: <IconCrm className="h-5 w-5" /> },
              { to: '/dashboard/sales', label: t('sidebar.orders'), icon: <IconSales className="h-5 w-5" /> },
              { to: '/dashboard/purchasing', label: t('sidebar.purchasing'), icon: <IconTruck className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Finance & Comptabilité',
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
            items: [
              { to: '/dashboard/hr', label: t('sidebar.hrManagement'), icon: <IconBriefcase className="h-5 w-5" /> },
            ],
          },
        ];

      case UserRole.PRODUCTION_DIRECTOR:
        return [
          {
            groupLabel: 'Production',
            items: [
              { to: '/dashboard/production', label: t('sidebar.production'), icon: <IconFactory className="h-5 w-5" /> },
              { to: '/dashboard/sales', label: t('sidebar.orders'), icon: <IconSales className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Maintenance',
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
    bg-[#1a1718] text-white flex flex-col transition-all duration-300 ease-in-out
    md:relative md:translate-x-0
    fixed h-full inset-y-0 left-0 z-40 border-r border-white/5
    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    ${isSidebarCollapsed ? 'w-[72px]' : 'w-64'}
  `;

  return (
    <div className="no-print">
      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={sidebarClasses}>
        {/* ── Logo & filiale ── */}
        <div className={`flex flex-col items-center justify-center transition-all duration-300 border-b border-white/5 ${isSidebarCollapsed ? 'p-3 py-4' : 'p-5'}`}>
          <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'h-9 w-9' : 'h-14 w-auto'}`}>
            <IconGmoLogo className="w-full h-full" />
          </div>
          {!isSidebarCollapsed && (
            <div className="mt-3 text-center w-full">
              <p className="text-sm font-bold text-white leading-tight">
                {subsidiaryName || (user.userRole === UserRole.ADMIN ? 'Vue Admin' : 'CaapMedia')}
              </p>
              {/* Role switcher: affiche des pills si l'utilisateur a des rôles supplémentaires */}
              {(user.additionalRoles ?? []).length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1 justify-center">
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
                <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#c6e911]/15 text-[#c6e911] tracking-wide uppercase">
                  {(user.userRole ?? '').replace(/_/g, ' ')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          <nav className={`${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
            {navGroups.length > 0 ? (
              navGroups.map((group, idx) => (
                <CollapsibleGroup
                  key={idx}
                  group={group}
                  isCollapsed={isSidebarCollapsed}
                  onItemClick={() => setIsSidebarOpen(false)}
                  currentPath={currentPath}
                />
              ))
            ) : (
              <div className="p-4 text-slate-500 text-sm text-center">{t('sidebar.noViewForRole')}</div>
            )}
          </nav>
        </div>

        {/* ── Footer ── */}
        <div className={`border-t border-white/5 ${isSidebarCollapsed ? 'p-2' : 'p-3'} space-y-1`}>
          {/* Bouton collapse (desktop uniquement) */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`hidden md:flex w-full items-center gap-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-200 ${
              isSidebarCollapsed ? 'justify-center px-3' : 'px-3'
            }`}
            title={isSidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          >
            <IconChevronDoubleLeft
              className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
            />
            {!isSidebarCollapsed && (
              <span className="text-sm font-medium">{t('sidebar.collapse')}</span>
            )}
          </button>

          {/* Déconnexion */}
          <NavLink
            to="/login"
            icon={<IconLogout className="h-5 w-5" />}
            label={t('common.logout')}
            isCollapsed={isSidebarCollapsed}
            onClick={() => { setIsSidebarOpen(false); authLogout(); }}
          />

          {!isSidebarCollapsed && (
            <p className="text-center text-[10px] text-slate-600 pt-1">
              CaapMedia &copy; 2024 · v2.0.0
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
