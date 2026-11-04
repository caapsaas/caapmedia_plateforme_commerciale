import { AuthAuditEvent } from '@prisma/client';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { LoggerService } from '../../utils/logger/logger.service';
export interface AuthAuditQuery {
    userId?: string;
    email?: string;
    event?: AuthAuditEvent;
    take?: number;
    skip?: number;
}
export interface AuthAuditEntry {
    userId?: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
}
export declare class AuthAuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService, logger: LoggerService);
    log(event: AuthAuditEvent, entry: AuthAuditEntry): Promise<void>;
    findMany(query: AuthAuditQuery): Promise<{
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
}
