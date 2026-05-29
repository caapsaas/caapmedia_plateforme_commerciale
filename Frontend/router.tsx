import { createRouter, createRoute, createRootRoute, Outlet, redirect, createRootRouteWithContext } from '@tanstack/react-router';
import App from './App'; // Nous allons refactorer App.tsx pour qu'il devienne notre layout
import { useAppContext } from './context/AppContext';
import { useAuth } from './context/AuthContext'; // Importez le hook d'authentification
import LoginPage from './Pages/LoginPage';
import ECommercePage from './components/ecommerce/ECommercePage';
import RealisationsPage from './components/ecommerce/RealisationsPage';
import CustomerAccountPage from './components/customer/CustomerAccountPage';
import Analytics from './Pages/Analytics';
import Sales from './components/sales/Sales';
import Crm from './Pages/Crm';
import Stock from './Pages/Stock';
import Purchasing from './components/purchasing/Purchasing';
import Caisse from './components/caisse/Caisse';
import MesCommandes from './Pages/MesCommandes';
import Finance from './Pages/Finance';
import Accounting from './Pages/Accounting';
import Configuration from './Pages/Configuration';
import HrManagement from './Pages/HrManagement';
import Secretariat from './Pages/Secretariat';
import Production from './Pages/Production';
import Maintenance from './components/maintenance/Maintenance';
import Equipements from './Pages/Equipements';


// 1. Utiliser createRootRouteWithContext pour typer le contexte du routeur
const rootRoute = createRootRouteWithContext<{
  auth: ReturnType<typeof useAuth>
  app: ReturnType<typeof useAppContext>
}>()({
  // Le reste de la configuration de la route racine
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
  beforeLoad: ({ context, location }) => {
    // Si le client n'est PAS authentifié (pas de contactToken), on le redirige
    if (!context.auth.contactToken) {
      throw redirect({
        to: '/', // Ou une page de login client spécifique si vous en avez une
        search: {
          redirect: location.href,
        },
      });
    }
  },
});

// 4. Route "layout" pour le tableau de bord
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Outlet, 
  beforeLoad: ({ context, location }) => {
    if (!context.auth.token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  loader: async ({ context }) => {
    if (!context.app.state.isRestored) {
      await new Promise<void>(resolve => {
        const check = () => {
          if (context.app.state.isRestored) {
            resolve();
          } else {
            setTimeout(check, 10); // Vérifie toutes les 10ms
          }
        };
        check();
      });
    }
    return {};
  }
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
const caisseRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/caisse', component: Caisse });
const maintenanceRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/maintenance', component: Maintenance });
const equipementsRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/equipements', component: Equipements });
const mesCommandesRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/mes-commandes',
  component: MesCommandes,
});

const configurationRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/configuration', component: Configuration });
const productionRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/production', component: Production });

// Routes qui dépendaient auparavant de wrappers
const secretariatRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/secretariat', component: Secretariat });
const hrRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/hr', component: HrManagement });
const financeRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/finance', component: Finance });
const accountingRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/accounting', component: Accounting });


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
    caisseRoute,
    mesCommandesRoute,
    financeRoute,
    accountingRoute,
    configurationRoute,
    hrRoute,
    secretariatRoute,
    productionRoute,
    maintenanceRoute,
    equipementsRoute,
  ]),
]);

// 7. Déclaration du routeur pour la type-sécurité (avant la création)
let router: ReturnType<typeof createRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
  // Déclarer la forme du contexte pour l'autocomplétion et la sécurité de type
  interface RouterContext {
    auth: ReturnType<typeof useAuth>;
  }
}

// 8. Création du routeur via une fonction pour injection de dépendance
export function createMyRouter(auth: ReturnType<typeof useAuth>, app: ReturnType<typeof useAppContext>) {
  router = createRouter({
    routeTree,
    context: {
      auth, // Le contexte est maintenant directement fourni à la création
      app,
    },
  });
  return router;
}
