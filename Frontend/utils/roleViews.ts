import { UserRole } from '../types';

/**
 * Vue par defaut vers laquelle rediriger un utilisateur selon son role actif -
 * utilisee apres connexion (LoginPage.tsx), lors d'un changement de role
 * (Header.tsx) et pour rediriger hors d'une vue non autorisee (router.tsx).
 * Anciennement dupliquee a l'identique dans ces deux premiers fichiers.
 */
export function getDefaultViewForRole(role?: UserRole): string {
  switch (role) {
    case UserRole.CAISSIER:
      return '/dashboard/caisse';
    case UserRole.COMMERCIAL:
      // Aligné sur gmo (getDefaultViewForRole::COMMERCIAL -> View.SALES) —
      // COMMERCIAL n'a plus accès au tableau de bord complet (voir
      // ANALYTICS_ALLOWED_ROLES ci-dessous), Commandes est sa page
      // d'atterrissage naturelle.
      return '/dashboard/sales';
    case UserRole.PURCHASING_MANAGER:
      return '/dashboard/purchasing';
    case UserRole.SECRETARY:
      return '/dashboard/secretariat';
    case UserRole.HR_MANAGER:
      return '/dashboard/hr';
    case UserRole.PRODUCTION_DIRECTOR:
      return '/dashboard/production';
    case UserRole.FINANCIAL_DIRECTOR:
      return '/dashboard/finance';
    // ADMIN/SUPER_ADMIN (et tout role non liste ci-dessus) retombent sur
    // /dashboard/ (Analyses) - seuls roles avec un droit d'acces reel a
    // cette page, voir ANALYTICS_ALLOWED_ROLES.
    default:
      return '/dashboard/';
  }
}

/**
 * Roles autorises a voir la page Analyses (/dashboard/) - doit rester en
 * synchro avec @Roles(...) sur GET /analytics/dashboard cote backend
 * (statistics/analytics/analytics.controller.ts). Un role absent d'ici qui
 * atterrit quand meme sur /dashboard/ (ex: lien direct, retour navigateur)
 * voit une page blanche - toutes ses requetes analytics sont rejetees en 403
 * sans que la page ne le signale.
 *
 * COMMERCIAL n'y figure plus (retire, comme sur gmo) : ce role garde l'acces
 * a /dashboard/sales-analytics (GET /analytics/sales reste ouvert a
 * COMMERCIAL cote backend) mais pas au tableau de bord complet, qui inclut
 * les onglets tresorerie (banque/coffre/caisse).
 */
export const ANALYTICS_ALLOWED_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.FINANCIAL_DIRECTOR,
];
