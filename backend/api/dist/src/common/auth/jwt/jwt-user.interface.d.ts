import { UserRole } from '@prisma/client';
export interface JwtUser {
    id: string;
    email: string;
    role: UserRole;
    roles: UserRole[];
    activeRole: UserRole;
    subsidiaryId: string;
    userRole?: UserRole;
    employeeId?: string | null;
}
