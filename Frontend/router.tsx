import { createRouter, createRoute, createRootRoute, Outlet, redirect, createRootRouteWithContext } from '@tanstack/react-router';
import App from './App'; // Nous allons refactorer App.tsx pour qu'il devienne notre layout
import { useAppContext } from './context/AppContext';
import { useAuth } from './context/AuthContext'; // Importez le hook d'authentification
import LoginPage from './Pages/LoginPage';
import CheckInPage from './Pages/CheckInPage';
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
import AccountingAccessAdmin from './Pages/AccountingAccessAdmin';
import Configuration from './Pages/Configuration';
import HrManagement from './Pages/HrManagement';
import Secretariat from './Pages/Secretariat';
import Production from './Pages/Production';
import Maintenance from './components/maintenance/Maintenance';
import Equipements from './Pages/Equipements';
import SecuritySettings from './Pages/SecuritySettings';
import { getDefaultViewForRole, ANALYTICS_ALLOWED_ROLES } from './utils/roleViews';


// Le token "user" vit dans un cookie httpOnly (illisible en JS) - au chargement
// de l'app, AuthContext doit d'abord interroger le serveur pour savoir si une
// session est active (voir isAuthResolved). Les beforeLoad qui dependent de
// l'authentification doivent attendre cette resolution avant de rediriger,
// sous peine de rediriger vers /login un utilisateur pourtant deja connecte.
//
// IMPORTANT: on lit `auth.authLive.current`, PAS `auth.isAuthResolved`
// directement. Le `context` recu par beforeLoad est un instantane fige au
// moment de l'invocation (React recree un nouvel objet contexte a chaque
// render, l'ancien ne mute jamais en place) - sur un refresh direct sur
// /dashboard/*, ce beforeLoad demarre avant que restoreSession() ait fini, et
// polling `auth.isAuthResolved` sur CET instantane ne verrait jamais le
// passage a `true` (page bloquee indefiniment). `authLive` est une ref React
// dont l'identite ne change jamais entre renders: meme un instantane fige y
// lit toujours la valeur la plus recente via `.current`.
function waitForAuthResolved(auth: ReturnType<typeof useAuth>): Promise<void> {
  if (auth.authLive.current.isAuthResolved) return Promise.resolve();
  return new Promise<void>(resolve => {
    const check = () => {
      if (auth.authLive.current.isAuthResolved) resolve();
      else setTimeout(check, 10);
    };
    check();
  });
}

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
  // Type le search param `redirect` (pose par dashboardRoute/customerAccountRoute
  // en beforeLoad quand un utilisateur non authentifie tente d'y acceder) -
  // sans ca, `useSearch({from: '/login'})` infere `{}` et LoginPage.tsx ne
  // peut pas lire `redirect` pour y renvoyer l'utilisateur apres connexion.
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
});

const checkInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/check-in',
  component: CheckInPage,
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
  beforeLoad: async ({ context, location }) => {
    await waitForAuthResolved(context.auth);
    if (!context.auth.authLive.current.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  // Meme raisonnement que waitForAuthResolved ci-dessus: on lit
  // isRestoredLive.current (ref stable), pas context.app.state.isRestored
  // (instantane fige) - sinon meme blocage indefini sur un refresh direct.
  loader: async ({ context }) => {
    if (!context.app.isRestoredLive.current) {
      await new Promise<void>(resolve => {
        const check = () => {
          if (context.app.isRestoredLive.current) {
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
  // La page Analyses n'est accessible qu'a un sous-ensemble de roles cote
  // backend (@Roles sur GET /analytics/*, voir ANALYTICS_ALLOWED_ROLES) - un
  // role hors de cette liste qui atterrit ici (lien direct, retour
  // navigateur, filiale sans autre route par defaut) ne voyait rien: ses
  // requetes analytics etaient rejetees en 403 sans que la page ne le
  // signale. On redirige plutot vers la page par defaut de son role, meme
  // logique que gmo (chaque role a une page d'atterrissage dediee).
  beforeLoad: ({ context }) => {
    // authLive.current (pas context.auth.user): meme raison que
    // waitForAuthResolved plus haut - context.auth est un instantane fige,
    // et un switchRole() suivi d'un router.navigate() immediat (voir
    // Header.tsx::handleRoleChange) peut atteindre ce beforeLoad avant que
    // React n'ait re-rendu AuthProvider avec le nouveau role.
    const role = context.auth.authLive.current.activeRole;
    if (!role || !ANALYTICS_ALLOWED_ROLES.includes(role)) {
      throw redirect({ to: getDefaultViewForRole(role) });
    }
  },
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
// Parametres personnels (2FA...) - accessible a tout role authentifie, pas de garde specifique.
const securityRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/security', component: SecuritySettings });

// Routes qui dépendaient auparavant de wrappers
const secretariatRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/secretariat', component: Secretariat });
const hrRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/hr', component: HrManagement });
const financeRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/finance', component: Finance });
const accountingRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/accounting', component: Accounting });
const accountingAccessRequestsRoute = createRoute({ getParentRoute: () => dashboardRoute, path: '/accounting-access-requests', component: AccountingAccessAdmin });


// 6. Création de l'arbre des routes
const routeTree = rootRoute.addChildren([
  indexRoute,
  realisationsRoute,
  loginRoute,
  checkInRoute,
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
    accountingAccessRequestsRoute,
    configurationRoute,
    hrRoute,
    secretariatRoute,
    productionRoute,
    maintenanceRoute,
    equipementsRoute,
    securityRoute,
  ]),
]);

// 8. Création du routeur: instance UNIQUE et stable, creee via useState(() =>
// createMyRouter(...)) dans index.tsx (une seule fois, au premier render de
// Root, avec le VRAI contexte auth/app deja disponible a ce moment - jamais
// undefined). Les renders suivants injectent le contexte frais via la prop
// `context` de <RouterProvider>, sans recreer le routeur.
//
// Pourquoi pas un contexte placeholder cree au chargement du module (avant
// meme le premier render React)? Sur un refresh directement sur /dashboard/*,
// TanStack Router evalue le beforeLoad de la route courante des la
// construction du routeur - un contexte.auth `undefined!` y provoque un
// crash synchrone (`Cannot read properties of undefined`) qui empeche
// React de monter quoi que ce soit: page blanche. En navigation interne
// (login -> dashboard) ca ne se voyait pas car le contexte reel existait
// deja avant que /dashboard soit atteint.
export function createMyRouter(auth: ReturnType<typeof useAuth>, app: ReturnType<typeof useAppContext>) {
  return createRouter({
    routeTree,
    context: { auth, app },
  });
}

type MyRouter = ReturnType<typeof createMyRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: MyRouter;
  }
  // Déclarer la forme du contexte pour l'autocomplétion et la sécurité de type
  interface RouterContext {
    auth: ReturnType<typeof useAuth>;
    app: ReturnType<typeof useAppContext>;
  }
}
