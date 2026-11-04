import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { LoggerService } from '../../utils/logger/logger.service';
import { Prisma, UserRole } from '@prisma/client';
import { RefreshTokenService, RequestMeta } from './refresh-token.service';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly logger;
    private readonly refreshTokenService;
    constructor(prisma: PrismaService, jwtService: JwtService, logger: LoggerService, refreshTokenService: RefreshTokenService);
    private assertCanAssignSuperAdmin;
    private hasAdminPrivileges;
    private hasGlobalAdminPrivileges;
    register(userName: string, email: string, password: string, role: UserRole, subsidiaryId: string, additionalRoles?: UserRole[], currentUser?: {
        roles?: UserRole[];
        role?: UserRole;
    }): Promise<{
        message: string;
        userId: string;
    }>;
    login(email: string, password: string): Promise<{
        twoFactorRequired: true;
        pendingToken: string;
        user?: undefined;
        subsidiary?: undefined;
    } | {
        twoFactorRequired: false;
        user: {
            subsidiary: {
                id: string;
                subsidiaryName: string;
                logoSvg: string;
                address: string;
                phone: string;
                email: string;
                ifu: string;
                rccm: string;
                bankName: string;
                accountNumber: string;
                swiftCode: string;
                shareCapital: Prisma.Decimal;
                isHeadquarter: boolean;
                taxRate: Prisma.Decimal;
                workingDays: number[];
                latitude: number | null;
                longitude: number | null;
                geofenceRadius: number;
            };
        } & {
            id: string;
            email: string;
            userName: string;
            passwordHash: string;
            subsidiaryId: string;
            userRole: import("@prisma/client").$Enums.UserRole;
            additionalRoles: import("@prisma/client").$Enums.UserRole[];
            roles: import("@prisma/client").$Enums.UserRole[];
            activeRole: import("@prisma/client").$Enums.UserRole | null;
            twoFactorSecret: string | null;
            twoFactorEnabled: boolean;
            twoFactorRecoveryCodes: string[];
        };
        subsidiary: {
            id: string;
            subsidiaryName: string;
            logoSvg: string;
            address: string;
            phone: string;
            email: string;
            ifu: string;
            rccm: string;
            bankName: string;
            accountNumber: string;
            swiftCode: string;
            shareCapital: Prisma.Decimal;
            isHeadquarter: boolean;
            taxRate: Prisma.Decimal;
            workingDays: number[];
            latitude: number | null;
            longitude: number | null;
            geofenceRadius: number;
        };
        pendingToken?: undefined;
    }>;
    issueTokens(user: {
        id: string;
        email: string;
        userName: string;
        userRole: UserRole;
        additionalRoles: UserRole[];
        roles: UserRole[];
        activeRole?: UserRole | null;
        subsidiaryId: string;
        twoFactorEnabled: boolean;
    }, meta?: RequestMeta): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            userName: string;
            userRole: import("@prisma/client").$Enums.UserRole;
            role: import("@prisma/client").$Enums.UserRole;
            activeRole: import("@prisma/client").$Enums.UserRole;
            roles: import("@prisma/client").$Enums.UserRole[];
            additionalRoles: import("@prisma/client").$Enums.UserRole[];
            subsidiaryId: string;
            twoFactorEnabled: boolean;
        };
    }>;
    refresh(presentedRefreshToken: string, meta?: RequestMeta): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, password: string): Promise<{
        message: string;
    }>;
    updateUser(id: string, data: {
        userName?: string;
        email?: string;
        password?: string;
        userRole?: UserRole;
        additionalRoles?: UserRole[];
        subsidiaryId?: string;
    }, currentUser: {
        id: string;
        role: UserRole;
        roles?: UserRole[];
        activeRole?: UserRole;
        subsidiaryId: string;
    }): Promise<{
        id: string;
        userName: string;
        email: string;
        userRole: import("@prisma/client").$Enums.UserRole;
        additionalRoles: import("@prisma/client").$Enums.UserRole[];
        subsidiaryId: string;
        subsidiary: {
            id: string;
            subsidiaryName: string;
            name: string;
        };
    }>;
    deleteUser(id: string, currentUser: {
        id: string;
        role?: UserRole;
        roles?: UserRole[];
        activeRole?: UserRole;
        subsidiaryId: string;
    }): Promise<{
        message: string;
    }>;
    getAllUsers(currentUser: {
        id: string;
        role?: UserRole;
        roles?: UserRole[];
        subsidiaryId: string;
    }, paginationQuery?: PaginationQueryDto & {
        subsidiaryId?: string;
    }): Promise<{
        data: {
            id: string;
            userName: string;
            email: string;
            userRole: import("@prisma/client").$Enums.UserRole;
            additionalRoles: import("@prisma/client").$Enums.UserRole[];
            subsidiaryId: string;
            subsidiary: {
                id: string;
                subsidiaryName: string;
                name: string;
            };
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    searchUsers(query: {
        email?: string;
        userName?: string;
        userRole?: UserRole;
        subsidiaryId?: string;
    } & PaginationQueryDto, currentUser: {
        id: string;
        role?: UserRole;
        roles?: UserRole[];
        subsidiaryId: string;
    }): Promise<{
        data: {
            id: string;
            userName: string;
            email: string;
            userRole: import("@prisma/client").$Enums.UserRole;
            additionalRoles: import("@prisma/client").$Enums.UserRole[];
            subsidiaryId: string;
            subsidiary: {
                id: string;
                subsidiaryName: string;
                name: string;
            };
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    logout(user: {
        email: string;
    }, presentedRefreshToken?: string): Promise<{
        message: string;
    }>;
    getProfileUser(user: {
        id: string;
        email: string;
        role: UserRole;
        subsidiaryId: string;
    }): Promise<{
        user: {
            role: import("@prisma/client").$Enums.UserRole;
            activeRole: import("@prisma/client").$Enums.UserRole;
            roles: import("@prisma/client").$Enums.UserRole[];
            id: string;
            email: string;
            userName: string;
            subsidiaryId: string;
            userRole: import("@prisma/client").$Enums.UserRole;
            additionalRoles: import("@prisma/client").$Enums.UserRole[];
            twoFactorEnabled: boolean;
        };
        subsidiary: {
            id: string;
            subsidiaryName: string;
            logoSvg: string;
            address: string;
            phone: string;
            email: string;
            ifu: string;
            rccm: string;
            bankName: string;
            accountNumber: string;
            swiftCode: string;
            shareCapital: Prisma.Decimal;
            isHeadquarter: boolean;
            taxRate: Prisma.Decimal;
            workingDays: number[];
            latitude: number | null;
            longitude: number | null;
            geofenceRadius: number;
        };
    }>;
    switchRole(userId: string, requestedRole: UserRole): Promise<{
        user: {
            role: import("@prisma/client").$Enums.UserRole;
            activeRole: import("@prisma/client").$Enums.UserRole;
            id: string;
            email: string;
            userName: string;
            subsidiaryId: string;
            userRole: import("@prisma/client").$Enums.UserRole;
            additionalRoles: import("@prisma/client").$Enums.UserRole[];
            roles: import("@prisma/client").$Enums.UserRole[];
            twoFactorEnabled: boolean;
        };
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        subsidiary: {
            id: string;
            subsidiaryName: string;
            logoSvg: string;
        };
        userName: string;
        subsidiaryId: string;
        userRole: import("@prisma/client").$Enums.UserRole;
    }>;
    findOneById(id: string): Promise<{
        subsidiary: {
            id: string;
            subsidiaryName: string;
            logoSvg: string;
            address: string;
            phone: string;
            email: string;
            ifu: string;
            rccm: string;
            bankName: string;
            accountNumber: string;
            swiftCode: string;
            shareCapital: Prisma.Decimal;
            isHeadquarter: boolean;
            taxRate: Prisma.Decimal;
            workingDays: number[];
            latitude: number | null;
            longitude: number | null;
            geofenceRadius: number;
        };
    } & {
        id: string;
        email: string;
        userName: string;
        passwordHash: string;
        subsidiaryId: string;
        userRole: import("@prisma/client").$Enums.UserRole;
        additionalRoles: import("@prisma/client").$Enums.UserRole[];
        roles: import("@prisma/client").$Enums.UserRole[];
        activeRole: import("@prisma/client").$Enums.UserRole | null;
        twoFactorSecret: string | null;
        twoFactorEnabled: boolean;
        twoFactorRecoveryCodes: string[];
    }>;
}
