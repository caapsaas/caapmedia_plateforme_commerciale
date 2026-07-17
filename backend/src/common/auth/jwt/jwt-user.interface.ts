import { UserRole } from '@prisma/client';

export interface JwtUser {
  id: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  /** Role actuellement actif (POST /auth/switch-role) - source de verite pour l'autorisation, voir role.guard.ts. */
  activeRole: UserRole;
  subsidiaryId: string;
}
