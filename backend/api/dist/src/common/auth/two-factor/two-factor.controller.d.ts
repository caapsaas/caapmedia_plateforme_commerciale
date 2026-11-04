import type { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { TwoFactorService } from './two-factor.service';
import { AuthService } from '../auth/auth.service';
import { AuthAuditService } from '../auth/auth-audit.service';
declare class TwoFactorCodeDto {
    code: string;
}
declare class TwoFactorDisableDto {
    password: string;
    code: string;
}
declare class TwoFactorLoginDto {
    pendingToken: string;
    code?: string;
    recoveryCode?: string;
}
export declare class TwoFactorController {
    private readonly twoFactorService;
    private readonly authService;
    private readonly authAuditService;
    private readonly prisma;
    private readonly jwtService;
    constructor(twoFactorService: TwoFactorService, authService: AuthService, authAuditService: AuthAuditService, prisma: PrismaService, jwtService: JwtService);
    setup(req: any): Promise<{
        qrCodeDataUrl: string;
        secret: string;
    }>;
    verify(req: any, dto: TwoFactorCodeDto): Promise<{
        message: string;
        recoveryCodes: string[];
    }>;
    disable(req: any, dto: TwoFactorDisableDto): Promise<{
        message: string;
    }>;
    login(dto: TwoFactorLoginDto, req: any, res: Response): Promise<{
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
    }>;
}
export {};
