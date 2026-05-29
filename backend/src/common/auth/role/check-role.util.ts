import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtUser } from '../jwt/jwt-user.interface';

export function checkRole(user: JwtUser, allowedRoles: UserRole[], message: string): void {
  const userRoles = user.roles ?? [user.role];
  const hasRole = allowedRoles.some(r => userRoles.includes(r));
  if (!hasRole) {
    throw new ForbiddenException(message);
  }
}
