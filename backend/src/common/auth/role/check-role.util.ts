import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtUser } from '../jwt/jwt-user.interface';
import { getActiveRole, isSuperAdmin } from './role-identity';

export function checkRole(
  user: JwtUser,
  allowedRoles: UserRole[],
  message: string,
): void {
  // SUPER_ADMIN bypasse tout check de role (sur roles[], pas activeRole: son
  // acces omniscient ne doit pas dependre du role qu'il a switche pour
  // preview), meme logique que RoleGuard.
  if (isSuperAdmin(user)) return;
  // Sinon, autorisation basee UNIQUEMENT sur activeRole - voir le commentaire
  // dans role.guard.ts pour le detail du changement (avant: OR sur tous les
  // roles de l'utilisateur, meme non actifs).
  const activeRole = getActiveRole(user);
  if (!allowedRoles.includes(activeRole)) {
    throw new ForbiddenException(message);
  }
}
