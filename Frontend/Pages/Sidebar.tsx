import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { UserRole } from '../types';
import { getPendingAccessCount } from '../services/apiAccounting/apiAccountingAccess';
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
import IconDocumentChartBar from '../components/icons/IconDocumentChartBar';
import IconDocumentText from '../components/icons/IconDocumentText';
import IconWallet from '../components/icons/IconWallet';
import IconTruckCoins from '../components/icons/IconTruckCoins';
import IconTrendingUp from '../components/icons/IconTrendingUp';
import IconCurrency from '../components/icons/IconCurrency';
import IconClipboardCheck from '../components/icons/IconClipboardCheck';
import IconCash from '../components/icons/IconCash';
import { Bell } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  label: React.ReactNode;
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
  label: React.ReactNode;
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

  // Extract text from ReactNode for tooltip
  const getLabelText = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return node.toString();
    if (Array.isArray(node)) return node.map(getLabelText).join('');
    if (node && typeof node === 'object' && 'props' in node) {
      const props = (node as any).props;
      if (props.children) return getLabelText(props.children);
    }
    return '';
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
        {!isCollapsed && <span className="text-xs font-medium tracking-wide whitespace-nowrap">{label}</span>}
      </Link>

      {isCollapsed && tooltipPos && createPortal(
        <div
          style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translateY(-50%)' }}
          className="fixed z-[9999] px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap border border-white/10 pointer-events-none"
        >
          {getLabelText(label)}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>,
        document.body
      )}
    </div>
  );
};

// Le routeur TanStack normalise les URLs sans slash final par defaut
// (trailingSlash: 'never', jamais configure explicitement dans router.tsx) -
// currentPath vaut donc '/dashboard', jamais '/dashboard/', meme si item.to
// (utilise pour la navigation) garde le slash. Meme correctif que
// SidebarDropdown.tsx::isItemActive.
const isNavItemActive = (item: NavItem, currentPath: string): boolean =>
  item.to === '/dashboard/' ? currentPath === '/dashboard' : currentPath.startsWith(item.to);

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar: React.FC = () => {
  const { t } = useI18n();
  const { state, dispatch } = useAppContext();
  const { user, subsidiary, logout: authLogout } = useAuth();
  const { isSidebarOpen, isSidebarCollapsed } = state;
  // activeRole vient desormais du backend (POST /auth/switch-role), pas d'un
  // apercu local - voir AuthContext.switchRole / Header.tsx.
  const activeRole = user?.activeRole ?? user?.userRole;
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Seul un ADMIN du siège (ou SUPER_ADMIN) peut approuver/refuser les demandes
  // d'accès JIT à la comptabilité — même règle que AccountingAccessService.isHeadquarterAdmin
  // côté backend. FINANCIAL_DIRECTOR n'a pas ce droit, même au siège.
  const isHeadquarterAdminUser = activeRole === UserRole.SUPER_ADMIN || (activeRole === UserRole.ADMIN && !!subsidiary?.isHeadquarter);

  const { data: pendingAccessCount = 0 } = useQuery({
    queryKey: ['accounting-access-pending-count'],
    queryFn: getPendingAccessCount,
    enabled: !!user && isHeadquarterAdminUser,
    refetchInterval: 60000,
  });

  if (!user || (!subsidiary && user.userRole !== UserRole.ADMIN && user.userRole !== UserRole.SUPER_ADMIN)) return null;

  const setIsSidebarOpen = (v: boolean) => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: v });
  const setIsSidebarCollapsed = (v: boolean) => dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: v });

  // Port fidele de Frontend_GMO/components/Sidebar.tsx::getNavItems: seuls les
  // roles avec BEAUCOUP d'items a categoriser (ADMIN, FINANCIAL_DIRECTOR,
  // COMMERCIAL) utilisent des dropdowns - les roles avec peu d'items
  // (CAISSIER, PURCHASING_MANAGER, SECRETARY, HR_MANAGER, PRODUCTION_DIRECTOR)
  // s'affichent en liste plate de NavLink, sans aucun regroupement/toggle,
  // meme si leurs items sont repartis sur plusieurs groupes logiques ici.
  const DROPDOWN_ROLES: (UserRole | undefined)[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.FINANCIAL_DIRECTOR];
  const useDropdowns = DROPDOWN_ROLES.includes(activeRole);

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
            groupLabel: 'Tableau de bord',
            groupIcon: <IconAnalytics className="h-5 w-5" />,
            items: [
              { to: '/dashboard/', label: t('sidebar.analytics'), icon: <IconAnalytics className="h-5 w-5" /> },
              { to: '/dashboard/sales-analytics', label: t('sidebar.salesAnalytics'), icon: <IconCurrency className="h-5 w-5" /> },
              { to: '/dashboard/purchase-analytics', label: t('sidebar.purchaseAnalytics'), icon: <IconDocumentChartBar className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Commerce',
            groupIcon: <IconCrm className="h-5 w-5" />,
            items: [
              { to: '/dashboard/crm', label: t('sidebar.crm'), icon: <IconCrm className="h-5 w-5" /> },
              { to: '/dashboard/proforma', label: t('sidebar.proforma'), icon: <IconDocumentText className="h-5 w-5" /> },
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
              // Décaissement (Coffre-fort + Banques) réservé au SUPER_ADMIN —
              // trésorerie centralisée au siège, comme gmo (« le super admin
              // gère le coffre et les banques »). Un ADMIN de filiale ne l'a
              // plus : la Caisse dépense (gérée par le Directeur Financier)
              // est désormais dans Finance, pas ici.
              ...(activeRole === UserRole.SUPER_ADMIN ? [{
                to: '/dashboard/disbursement',
                label: t('sidebar.disbursement'),
                icon: <IconWallet className="h-5 w-5" />,
              }] : []),
              { to: '/dashboard/credit-history', label: t('sidebar.creditHistory'), icon: <IconTruckCoins className="h-5 w-5" /> },
              { to: '/dashboard/financial-history', label: t('sidebar.financialHistory'), icon: <IconTrendingUp className="h-5 w-5" /> },
              { to: '/dashboard/accountings', label: 'Comptabilité', icon: <IconAccounting className="h-5 w-5" /> },
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
          {
            groupLabel: 'Outils',
            groupIcon: <Bell className="h-5 w-5" />,
            items: [
              { to: '/dashboard/notifications', label: t('sidebar.notifications'), icon: <Bell className="h-5 w-5" /> },
            ],
          },
          // Lien autonome hors dropdown, meme emplacement/logique que
          // Frontend_GMO/components/Sidebar.tsx (rendu en NavLink direct, pas
          // imbrique dans un groupe) - reserve au siege, badge de compteur.
          ...(isHeadquarterAdminUser ? [{
            groupLabel: 'Demandes comptabilité',
            groupIcon: <IconClipboardCheck className="h-5 w-5" />,
            items: [{
              to: '/dashboard/accounting-access-requests',
              label: (
                <span className="flex items-center gap-2">
                  Demandes comptabilité
                  {pendingAccessCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                      {pendingAccessCount}
                    </span>
                  )}
                </span>
              ),
              icon: <IconClipboardCheck className="h-5 w-5" />,
            }],
          }] : []),
        ];

      case UserRole.COMMERCIAL:
        return [
          // COMMERCIAL n'a pas acces au tableau de bord complet (onglets
          // tresorerie banque/coffre/caisse) - seulement a l'analyse des
          // ventes, meme restriction que Frontend_GMO/components/Sidebar.tsx
          // (getNavItems::COMMERCIAL) et GET /analytics/dashboard cote
          // backend (voir analytics.controller.ts).
          {
            groupLabel: 'Tableau de bord',
            groupIcon: <IconCurrency className="h-5 w-5" />,
            items: [
              { to: '/dashboard/sales-analytics', label: t('sidebar.salesAnalytics'), icon: <IconCurrency className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Commerce',
            groupIcon: <IconCrm className="h-5 w-5" />,
            items: [
              { to: '/dashboard/crm', label: t('sidebar.crm'), icon: <IconCrm className="h-5 w-5" /> },
              { to: '/dashboard/proforma', label: t('sidebar.proforma'), icon: <IconDocumentText className="h-5 w-5" /> },
              { to: '/dashboard/sales', label: t('sidebar.orders'), icon: <IconSales className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Outils',
            groupIcon: <Bell className="h-5 w-5" />,
            items: [
              { to: '/dashboard/notifications', label: t('sidebar.notifications'), icon: <Bell className="h-5 w-5" /> },
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
              // La caisse ne fait l'objet d'aucun décaissement direct : un
              // caissier ne fait que des remises de caisse (voir
              // Finance.tsx::FinanceView.CASH_REMITTANCES, seul onglet visible
              // pour ce rôle).
              { to: '/dashboard/finance', label: t('cashRemittance.title'), icon: <IconCash className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Outils',
            groupIcon: <Bell className="h-5 w-5" />,
            items: [
              { to: '/dashboard/notifications', label: t('sidebar.notifications'), icon: <Bell className="h-5 w-5" /> },
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
          {
            groupLabel: 'Outils',
            groupIcon: <Bell className="h-5 w-5" />,
            items: [
              { to: '/dashboard/notifications', label: t('sidebar.notifications'), icon: <Bell className="h-5 w-5" /> },
            ],
          },
        ];

      case UserRole.FINANCIAL_DIRECTOR:
        return [
          {
            groupLabel: 'Tableau de bord',
            groupIcon: <IconAnalytics className="h-5 w-5" />,
            items: [
              { to: '/dashboard/', label: t('sidebar.analytics'), icon: <IconAnalytics className="h-5 w-5" /> },
              { to: '/dashboard/sales-analytics', label: t('sidebar.salesAnalytics'), icon: <IconCurrency className="h-5 w-5" /> },
              { to: '/dashboard/purchase-analytics', label: t('sidebar.purchaseAnalytics'), icon: <IconDocumentChartBar className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Commerce',
            groupIcon: <IconCrm className="h-5 w-5" />,
            items: [
              { to: '/dashboard/crm', label: t('sidebar.crm'), icon: <IconCrm className="h-5 w-5" /> },
              { to: '/dashboard/proforma', label: t('sidebar.proforma'), icon: <IconDocumentText className="h-5 w-5" /> },
              { to: '/dashboard/sales', label: t('sidebar.orders'), icon: <IconSales className="h-5 w-5" /> },
            ],
          },
          {
            // Aligné sur gmo (Logistique & Stock) : achats + stock séparés
            // de "Commerce", un directeur financier a besoin de voir le
            // stock (valorisation, immobilisation en marchandise), pas
            // seulement les achats.
            groupLabel: 'Opérations',
            groupIcon: <IconTruck className="h-5 w-5" />,
            items: [
              { to: '/dashboard/purchasing', label: t('sidebar.purchasing'), icon: <IconTruck className="h-5 w-5" /> },
              { to: '/dashboard/stock', label: t('sidebar.stockManagement'), icon: <IconStock className="h-5 w-5" /> },
            ],
          },
          {
            // Décaissement (Coffre-fort/Banques) retiré : réservé au
            // SUPER_ADMIN (trésorerie centralisée au siège). La Caisse
            // dépense de sa filiale reste gérée ici via Finance & Gestion.
            groupLabel: 'Finance & Comptabilité',
            groupIcon: <IconFinance className="h-5 w-5" />,
            items: [
              { to: '/dashboard/finance', label: t('sidebar.finance'), icon: <IconFinance className="h-5 w-5" /> },
              { to: '/dashboard/credit-history', label: t('sidebar.creditHistory'), icon: <IconTruckCoins className="h-5 w-5" /> },
              { to: '/dashboard/financial-history', label: t('sidebar.financialHistory'), icon: <IconTrendingUp className="h-5 w-5" /> },
              { to: '/dashboard/accountings', label: 'Comptabilité', icon: <IconAccounting className="h-5 w-5" /> },
            ],
          },
          {
            groupLabel: 'Outils',
            groupIcon: <Bell className="h-5 w-5" />,
            items: [
              { to: '/dashboard/notifications', label: t('sidebar.notifications'), icon: <Bell className="h-5 w-5" /> },
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
          {
            groupLabel: 'Outils',
            groupIcon: <Bell className="h-5 w-5" />,
            items: [
              { to: '/dashboard/notifications', label: t('sidebar.notifications'), icon: <Bell className="h-5 w-5" /> },
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
          {
            groupLabel: 'Outils',
            groupIcon: <Bell className="h-5 w-5" />,
            items: [
              { to: '/dashboard/notifications', label: t('sidebar.notifications'), icon: <Bell className="h-5 w-5" /> },
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
          {
            groupLabel: 'Outils',
            groupIcon: <Bell className="h-5 w-5" />,
            items: [
              { to: '/dashboard/notifications', label: t('sidebar.notifications'), icon: <Bell className="h-5 w-5" /> },
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
          <img 
            src="/CaapMedia.png" 
            alt="CaapMedia Logo" 
            className={`rounded-lg transition-all duration-300 ${isSidebarCollapsed ? 'h-10 w-10' : 'h-16 w-16'}`}
          />
        </div>

        {/* ── Filiale ── */}
        {/* Le role (et le switch entre plusieurs roles) s'affiche dans le
            Header, pas ici - meme emplacement que Frontend_GMO/components/
            Header.tsx (tabs de roles sous la barre principale), pas dans
            Frontend_GMO/components/Sidebar.tsx qui n'affiche aucun role. */}
        {!isSidebarCollapsed && (
          <div className="px-4 py-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
              <p className="text-xs font-medium text-slate-200 truncate">
                {subsidiaryName || (user.userRole === UserRole.ADMIN || user.userRole === UserRole.SUPER_ADMIN ? 'Vue Admin' : 'CaapMedia')}
              </p>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          <nav className={`space-y-1 ${isSidebarCollapsed ? 'px-3' : 'px-4'}`}>
            {navGroups.length === 0 ? (
              <div className="p-4 text-slate-500 text-sm text-center">{t('sidebar.noViewForRole')}</div>
            ) : !useDropdowns ? (
              // Role "flat": tous les items de tous les groupes a plat, en
              // NavLink directs - pas de regroupement/toggle du tout.
              navGroups.flatMap((group) => group.items).map((item) => {
                const isActive = isNavItemActive(item, currentPath);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive}
                    isCollapsed={isSidebarCollapsed}
                    onClick={() => setIsSidebarOpen(false)}
                  />
                );
              })
            ) : (
              navGroups.map((group) => {
                // Un dropdown sert a regrouper PLUSIEURS elements - un groupe
                // a un seul element n'a pas besoin d'un toggle ouvert/ferme,
                // juste un lien direct.
                if (group.items.length === 1) {
                  const item = group.items[0];
                  const isActive = isNavItemActive(item, currentPath);
                  return (
                    <NavLink
                      key={group.groupLabel}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      isActive={isActive}
                      isCollapsed={isSidebarCollapsed}
                      onClick={() => setIsSidebarOpen(false)}
                    />
                  );
                }
                return (
                  <SidebarDropdown
                    key={group.groupLabel}
                    title={group.groupLabel}
                    icon={group.groupIcon}
                    items={group.items}
                    isCollapsed={isSidebarCollapsed}
                    currentPath={currentPath}
                    onItemClick={() => setIsSidebarOpen(false)}
                  />
                );
              })
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
              <span className="text-xs font-medium whitespace-nowrap">{t('sidebar.collapse')}</span>
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
