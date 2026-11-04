import { UserRole } from '@prisma/client';
export interface RoleIdentity {
    role?: UserRole;
    userRole?: UserRole;
    activeRole?: UserRole;
    roles?: UserRole[];
}
export declare function getActiveRole(user: RoleIdentity): UserRole | undefined;
export declare function isSuperAdmin(user: RoleIdentity): boolean;
