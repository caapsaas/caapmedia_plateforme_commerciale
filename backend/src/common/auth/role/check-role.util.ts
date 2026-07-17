import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtUser } from '../jwt/jwt-user.interface';

export function checkRole(
  user: JwtUser,
  allowedRoles: UserRole[],
  message: string,
): void {
  // SUPER_ADMIN bypasse tout check de role (sur roles[], pas activeRole: son
  // acces omniscient ne doit pas dependre du role qu'il a switche pour
  // preview), meme logique que RoleGuard.
  const userRoles = user.roles ?? [user.role];
  if (userRoles.includes(UserRole.SUPER_ADMIN)) return;
  // Sinon, autorisation basee UNIQUEMENT sur activeRole - voir le commentaire
  // dans role.guard.ts pour le detail du changement (avant: OR sur tous les
  // roles de l'utilisateur, meme non actifs).
  const activeRole = user.activeRole ?? user.role;
  if (!allowedRoles.includes(activeRole)) {
    throw new ForbiddenException(message);
  }
}
