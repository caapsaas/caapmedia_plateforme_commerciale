"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../utils/prisma/prisma.service");
const logger_service_1 = require("../../utils/logger/logger.service");
const auth_audit_service_1 = require("./auth-audit.service");
const REFRESH_TOKEN_BYTES = 64;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
let RefreshTokenService = class RefreshTokenService {
    prisma;
    logger;
    authAuditService;
    constructor(prisma, logger, authAuditService) {
        this.prisma = prisma;
        this.logger = logger;
        this.authAuditService = authAuditService;
    }
    hash(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    async issue(userId, meta = {}) {
        const token = (0, crypto_1.randomBytes)(REFRESH_TOKEN_BYTES).toString('hex');
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: this.hash(token),
                expiresAt,
                userAgent: meta.userAgent,
                ipAddress: meta.ipAddress,
            },
        });
        return { token, expiresAt };
    }
    async rotate(presentedToken, meta = {}) {
        const tokenHash = this.hash(presentedToken);
        const existing = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
        });
        if (!existing) {
            throw new common_1.UnauthorizedException('Refresh token invalide');
        }
        if (existing.revokedAt) {
            this.logger.warn(`Refresh token deja revoque reutilise pour user ${existing.userId} - revocation de toutes ses sessions`, 'RefreshTokenService');
            await this.revokeAllForUser(existing.userId);
            await this.authAuditService.log('REFRESH_TOKEN_REUSE_DETECTED', {
                userId: existing.userId,
                ipAddress: meta.ipAddress,
                userAgent: meta.userAgent,
            });
            throw new common_1.UnauthorizedException('Refresh token invalide');
        }
        if (existing.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token expire');
        }
        await this.prisma.refreshToken.update({
            where: { tokenHash },
            data: { revokedAt: new Date() },
        });
        const issued = await this.issue(existing.userId, meta);
        return { userId: existing.userId, issued };
    }
    async revoke(presentedToken) {
        const tokenHash = this.hash(presentedToken);
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async revokeAllForUser(userId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
};
exports.RefreshTokenService = RefreshTokenService;
exports.RefreshTokenService = RefreshTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logger_service_1.LoggerService,
        auth_audit_service_1.AuthAuditService])
], RefreshTokenService);
//# sourceMappingURL=refresh-token.service.js.map