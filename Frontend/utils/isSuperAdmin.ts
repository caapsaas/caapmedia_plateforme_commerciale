import { UserRole } from '../types';
import type { User } from '../types';

export const isSuperAdmin = (user?: User | null): boolean =>
    user?.userRole === UserRole.SUPER_ADMIN ||
    user?.additionalRoles?.includes(UserRole.SUPER_ADMIN) === true;
