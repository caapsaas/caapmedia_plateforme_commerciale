import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import App from './App'; // Nous allons refactorer App.tsx pour qu'il devienne notre layout
import { useAppContext } from './context/AppContext';
import LoginPage from './Pages/LoginPage';
import ECommercePage from './components/ecommerce/ECommercePage';
import RealisationsPage from './components/ecommerce/RealisationsPage';
import CustomerAccountPage from './components/customer/CustomerAccountPage';
import Analytics from './Pages/Analytics';
import Sales from './components/sales/Sales';
import Crm from './Pages/Crm';
import Stock from './Pages/Stock';
import Purchasing from './Pages/Purchasing';
import AiMarketing from './Pages/AiMarketing';
import Caisse from './Pages/Caisse';
import MesCommandes from './Pages/MesCommandes';
import Finance from './Pages/Finance';
import Configuration from './Pages/Configuration';
import HrManagement from './Pages/HrManagement';
import Secretariat from './Pages/Secretariat';
import Production from './Pages/Production';
import Maintenance from './Pages/Maintenance';
import Equipements from './Pages/Equipements';

// 1. La route racine (Root) qui contiendra notre layout principal
const rootRoute = createRootRoute({
  component: App, // App.tsx devient le composant de layout
});

// 2. Routes publiques
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ECommercePage,
});

const realisationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/realisations',
  component: RealisationsPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// 3. Routes protégées pour le compte client
const customerAccountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account',
  component: CustomerAccountPage,
  // TODO: Ajouter une logique de redirection si le client n'est pas connecté
});

// 4. Route "layout" pour le tableau de bord
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => <Outlet />, // Ce composant rendra les routes enfants
  // TODO: Ajouter une logique de redirection si l'employé n'est pas connecté
});

// 5. Routes enfants du tableau de bord
const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/',
  component: Analytics,
});

const salesRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/sales', component: Sales });
const crmRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/crm', component: Crm });
const stockRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/stock', component: Stock });
const purchasingRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/purchasing', component: Purchasing });
const aiMarketingRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/ai-marketing', component: AiMarketing });
const caisseRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/caisse', component: Caisse });
const mesCommandesRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/mes-commandes', component: MesCommandes });
const financeRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/finance', component: Finance });
const configurationRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/configuration', component: Configuration });
const hrRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/hr', component: HrManagement });
const productionRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/production', component: Production });

// Wrapper for components that need the current subsidiary
const SecretariatRouteComponent = () => {
  const { state } = useAppContext();
  if (!state.currentSubsidiary) return <div>Loading subsidiary...</div>;
  return <Secretariat subsidiary={state.currentSubsidiary} />;
};

const MaintenanceRouteComponent = () => {
  const { state } = useAppContext();
  if (!state.currentSubsidiary) return <div>Loading subsidiary...</div>;
  return <Maintenance subsidiary={state.currentSubsidiary} />;
};

const EquipementsRouteComponent = () => {
  const { state } = useAppContext();
  if (!state.currentSubsidiary) return <div>Loading subsidiary...</div>;
  return <Equipements subsidiary={state.currentSubsidiary} />;
};

const secretariatRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/secretariat', component: SecretariatRouteComponent });
const maintenanceRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/maintenance', component: MaintenanceRouteComponent });
const equipementsRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/equipements', component: EquipementsRouteComponent });


// 6. Création de l'arbre des routes
const routeTree = rootRoute.addChildren([
  indexRoute,
  realisationsRoute,
  loginRoute,
  customerAccountRoute,
  dashboardRoute.addChildren([
    dashboardIndexRoute,
    salesRoute,
    crmRoute,
    stockRoute,
    purchasingRoute,
    aiMarketingRoute,
    caisseRoute,
    mesCommandesRoute,
    financeRoute,
    configurationRoute,
    hrRoute,
    secretariatRoute,
    productionRoute,
    maintenanceRoute,
    equipementsRoute,
  ]),
]);

// 7. Création du routeur
export const router = createRouter({ routeTree });

// 8. Déclaration du routeur pour la type-sécurité
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
