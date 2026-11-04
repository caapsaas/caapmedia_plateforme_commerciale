import { Prisma } from '@prisma/client';
import { PrismaService } from "../../../common/utils/prisma/prisma.service";
export declare const ATTENDANCE_QR_TTL_MS = 120000;
type TokenReader = Pick<Prisma.TransactionClient, 'dynamicToken' | 'subsidiaryQrCode'>;
export declare class DynamicTokenService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPermanentToken(subsidiaryId: string, regenerate?: boolean): Promise<{
        token: string;
        expiresAt: any;
    }>;
    private issue;
    generateToken(subsidiaryId: string): Promise<{
        token: string;
        expiresAt: Date;
    }>;
    getActiveToken(subsidiaryId: string): Promise<{
        token: string;
        expiresAt: Date;
    }>;
    validateToken(token: string, client?: TokenReader): Promise<string>;
}
export {};
