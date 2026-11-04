import type { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthAuditService } from './auth-audit.service';
import { UserRole, AuthAuditEvent } from '@prisma/client';
import { PaginationQueryDto } from "../../pagination/dto/pagination-query.dto";
declare class RegisterDto {
    userName: string;
    email: string;
    password: string;
    userRole: UserRole;
    additionalRoles?: UserRole[];
    subsidiaryId: string;
}
declare class LoginDto {
    email: string;
    password: string;
}
declare class ForgotPasswordDto {
    email: string;
}
declare class ResetPasswordDto {
    token: string;
    password: string;
}
declare class SwitchRoleDto {
    role: UserRole;
}
declare class UpdateUserDto {
    userName?: string;
    email?: string;
    password?: string;
    userRole?: UserRole;
    additionalRoles?: UserRole[];
    subsidiaryId?: string;
}
declare class GetUsersQueryDto extends PaginationQueryDto {
    subsidiaryId?: string;
}
declare class SearchUsersDto extends PaginationQueryDto {
    email?: string;
    userName?: string;
    userRole?: UserRole;
    subsidiaryId?: string;
}
declare class AuditLogQueryDto {
    userId?: string;
    email?: string;
    event?: AuthAuditEvent;
    take?: number;
    skip?: number;
}
export declare class AuthController {
    private authService;
    private authAuditService;
    constructor(authService: AuthService, authAuditService: AuthAuditService);
    register(dto: RegisterDto, req: any): Promise<{
        message: string;
        userId: string;
    }>;
    login(dto: LoginDto, req: any, res: Response): Promise<{
        twoFactorRequired: boolean;
        pendingToken: string;
        user?: undefined;
        subsidiary?: undefined;
    } | {
        twoFactorRequired: boolean;
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
            shareCapital: import("@prisma/client/runtime/library").Decimal;
            isHeadquarter: boolean;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            workingDays: number[];
            latitude: number | null;
            longitude: number | null;
            geofenceRadius: number;
        };
        pendingToken?: undefined;
    }>;
    refresh(req: any, res: Response): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto, req: any): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    switchRole(dto: SwitchRoleDto, req: any): Promise<{
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
    getProfileUser(req: any): Promise<{
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
            shareCapital: import("@prisma/client/runtime/library").Decimal;
            isHeadquarter: boolean;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            workingDays: number[];
            latitude: number | null;
            longitude: number | null;
            geofenceRadius: number;
        };
    }>;
    updateUser(id: string, dto: UpdateUserDto, req: any): Promise<{
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
    deleteUser(id: string, req: any): Promise<{
        message: string;
    }>;
    getAllUsers(req: any, paginationQuery: GetUsersQueryDto): Promise<{
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
    searchUsers(query: SearchUsersDto, req: any): Promise<{
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
    getAuditLog(query: AuditLogQueryDto): Promise<{
        entries: {
            id: string;
            email: string | null;
            userId: string | null;
            event: import("@prisma/client").$Enums.AuthAuditEvent;
            ipAddress: string | null;
            userAgent: string | null;
            createdAt: Date;
        }[];
        total: number;
        take: number;
        skip: number;
    }>;
    logout(req: any, res: Response): Promise<{
        message: string;
    }>;
    getProfile(req: any): Promise<{
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
}
export {};
