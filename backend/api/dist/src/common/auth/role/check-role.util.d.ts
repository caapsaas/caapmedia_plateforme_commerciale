import { UserRole } from '@prisma/client';
import { JwtUser } from '../jwt/jwt-user.interface';
export declare function checkRole(user: JwtUser, allowedRoles: UserRole[], message: string): void;
