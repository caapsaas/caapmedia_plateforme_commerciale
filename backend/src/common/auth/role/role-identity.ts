import { UserRole } from '@prisma/client';

/** Identité structurelle compatible avec les anciens services pendant leur migration. */
export interface RoleIdentity {
  role?: UserRole;
  userRole?: UserRole;
  activeRole?: UserRole;
  roles?: UserRole[];
}

export function getActiveRole(user: RoleIdentity): UserRole | undefined {
  return user.activeRole ?? user.role ?? user.userRole;
}

/** Exception explicite existante : le super administrateur conserve son accès global. */
export function isSuperAdmin(user: RoleIdentity): boolean {
  const roles = user.roles?.length ? user.roles : [user.role ?? user.userRole];
  return roles.includes(UserRole.SUPER_ADMIN);
}
