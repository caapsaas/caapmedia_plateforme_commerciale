import { PrismaService } from '../../utils/prisma/prisma.service';
import { LoggerService } from '../../utils/logger/logger.service';
import { AuthAuditService } from './auth-audit.service';
export interface IssuedRefreshToken {
    token: string;
    expiresAt: Date;
}
export interface RequestMeta {
    userAgent?: string;
    ipAddress?: string;
}
export declare class RefreshTokenService {
    private readonly prisma;
    private readonly logger;
    private readonly authAuditService;
    constructor(prisma: PrismaService, logger: LoggerService, authAuditService: AuthAuditService);
    private hash;
    issue(userId: string, meta?: RequestMeta): Promise<IssuedRefreshToken>;
    rotate(presentedToken: string, meta?: RequestMeta): Promise<{
        userId: string;
        issued: IssuedRefreshToken;
    }>;
    revoke(presentedToken: string): Promise<void>;
    revokeAllForUser(userId: string): Promise<void>;
}
