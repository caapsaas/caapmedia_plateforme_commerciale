import { UserRole } from '@prisma/client';

export interface JwtUser {
  id: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  subsidiaryId: string;
}
