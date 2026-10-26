import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  getActiveRole,
  isSuperAdmin,
  RoleIdentity,
} from '../auth/role/role-identity';

/**
 * Forme minimale requise pour resoudre un scope filiale. Volontairement
 * structurelle (pas liee a JwtUser ni au type Prisma User) car req.user est
 * type de facon incoherente selon les controllers historiques du projet.
 */
export interface ScopableUser extends RoleIdentity {
  subsidiaryId: string;
}

export interface SubsidiaryScopeContext {
  subsidiaryId: string;
  hasGlobalScope: boolean;
}

function requireSubsidiaryId(subsidiaryId: string): void {
  if (!subsidiaryId?.trim()) {
    throw new ForbiddenException(
      'Une filiale est requise pour cette opération.',
    );
  }
}

/**
 * Determine si l'utilisateur a une vue consolidee (toutes filiales) ou doit
 * etre restreint a sa propre filiale.
 *
 * SUPER_ADMIN a systematiquement le scope global. `extraGlobalRoles` permet
 * a un module d'autoriser aussi une vue consolidee au role ACTIF (ex.
 * FINANCIAL_DIRECTOR sur les rapports financiers) sans dupliquer cette logique
 * partout - voir Doc/architecture-multi-filiale-auth-rbac.md section 2.2/4.2.
 */
export function resolveScopeContext(
  user: ScopableUser,
  extraGlobalRoles: UserRole[] = [],
): SubsidiaryScopeContext {
  requireSubsidiaryId(user?.subsidiaryId);
  const activeRole = getActiveRole(user);
  const hasGlobalScope =
    isSuperAdmin(user) ||
    (activeRole !== undefined && extraGlobalRoles.includes(activeRole));
  return { subsidiaryId: user.subsidiaryId, hasGlobalScope };
}

/**
 * Injecte le filtre subsidiaryId dans une clause `where` Prisma.
 *
 * - Utilisateur sans scope global: TOUJOURS force sur sa propre filiale.
 *   `requestedSubsidiaryId` est ignore - c'est ce qui empeche un utilisateur
 *   de lire les donnees d'une autre filiale en passant un id arbitraire en
 *   query param (IDOR inter-filiale).
 * - Utilisateur avec scope global: vue consolidee par defaut, ou filtree sur
 *   `requestedSubsidiaryId` si fourni (drill-down depuis le dashboard super-admin).
 */
export function withSubsidiaryScope<T extends Record<string, unknown>>(
  where: T,
  ctx: SubsidiaryScopeContext,
  requestedSubsidiaryId?: string,
): T & { subsidiaryId?: string } {
  requireSubsidiaryId(ctx?.subsidiaryId);
  if (ctx.hasGlobalScope) {
    return requestedSubsidiaryId
      ? { ...where, subsidiaryId: requestedSubsidiaryId }
      : where;
  }
  return { ...where, subsidiaryId: ctx.subsidiaryId };
}

/**
 * Resout l'id de filiale effectif a utiliser pour une requete qui ne passe
 * pas par `withSubsidiaryScope` (ex: agregations SQL brutes, appels de
 * service qui prennent un `subsidiaryId?: string` en parametre simple).
 * Retourne `undefined` uniquement si l'utilisateur a un scope global ET n'a
 * pas demande de filiale precise (= vue consolidee).
 */
export function resolveEffectiveSubsidiaryId(
  ctx: SubsidiaryScopeContext,
  requestedSubsidiaryId?: string,
): string | undefined {
  requireSubsidiaryId(ctx?.subsidiaryId);
  if (ctx.hasGlobalScope) {
    return requestedSubsidiaryId || undefined;
  }
  return ctx.subsidiaryId;
}

/**
 * A appeler apres avoir charge une entite par id (findUnique) pour verifier
 * qu'elle appartient bien a la filiale de l'utilisateur, quand la requete
 * elle-meme n'a pas pu filtrer par subsidiaryId (lookup par id seul).
 */
export function assertSubsidiaryAccess(
  entitySubsidiaryId: string,
  ctx: SubsidiaryScopeContext,
): void {
  requireSubsidiaryId(ctx?.subsidiaryId);
  if (!ctx.hasGlobalScope && entitySubsidiaryId !== ctx.subsidiaryId) {
    throw new ForbiddenException("Vous n'avez pas acces a cette ressource.");
  }
}
