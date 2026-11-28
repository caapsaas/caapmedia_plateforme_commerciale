import { UserRole } from '@prisma/client';

export interface JwtUser {
  id: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  /** Role actuellement actif (POST /auth/switch-role) - source de verite pour l'autorisation, voir role.guard.ts. */
  activeRole: UserRole;
  /** Filiale active courante (peut différer de homeSubsidiaryId pour les profils multi-filiales). */
  subsidiaryId: string;
  /** Filiale de rattachement d'origine de l'utilisateur. */
  homeSubsidiaryId?: string;
  /** Liste des filiales explicitement autorisées pour cet utilisateur. */
  allowedSubsidiaryIds?: string[];
  /** Alias historique, conservé pendant la migration des services. */
  userRole?: UserRole;
  employeeId?: string | null;
}
