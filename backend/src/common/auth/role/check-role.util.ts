import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtUser } from '../jwt/jwt-user.interface';

export function checkRole(user: JwtUser, allowedRoles: UserRole[], message: string): void {
  const userRoles = user.roles ?? [user.role];
  // SUPER_ADMIN bypasse tout check de role, meme logique que RoleGuard.
  if (userRoles.includes(UserRole.SUPER_ADMIN)) return;
  const hasRole = allowedRoles.some(r => userRoles.includes(r));
  if (!hasRole) {
    throw new ForbiddenException(message);
  }
}
