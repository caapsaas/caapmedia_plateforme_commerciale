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
exports.DynamicTokenService = exports.ATTENDANCE_QR_TTL_MS = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../../common/utils/prisma/prisma.service");
exports.ATTENDANCE_QR_TTL_MS = 120000;
let DynamicTokenService = class DynamicTokenService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPermanentToken(subsidiaryId, regenerate = false) {
        return this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw `
        SELECT id FROM subsidiaries WHERE id = ${subsidiaryId} FOR UPDATE
      `;
            const existing = await tx.subsidiaryQrCode.findUnique({
                where: { subsidiaryId },
            });
            if (existing?.isActive && !regenerate)
                return { token: existing.token, expiresAt: null };
            if (existing) {
                await tx.dynamicToken.updateMany({
                    where: { token: existing.token, isUsed: false },
                    data: { isUsed: true, usedAt: new Date() },
                });
            }
            const latestDynamic = !existing && !regenerate
                ? await tx.dynamicToken.findFirst({
                    where: { subsidiaryId },
                    orderBy: { createdAt: 'desc' },
                    select: { token: true },
                })
                : null;
            const token = latestDynamic?.token ?? (0, crypto_1.randomUUID)();
            const qr = await tx.subsidiaryQrCode.upsert({
                where: { subsidiaryId },
                create: { subsidiaryId, token, isActive: true },
                update: { token, isActive: true },
            });
            return { token: qr.token, expiresAt: null };
        });
    }
    async issue(subsidiaryId, force) {
        return this.prisma.$transaction(async (tx) => {
            const site = await tx.$queryRaw `SELECT id FROM subsidiaries WHERE id = ${subsidiaryId} FOR UPDATE`;
            if (!site.length)
                throw new common_1.NotFoundException('Filiale introuvable.');
            const now = new Date();
            const active = await tx.dynamicToken.findFirst({
                where: {
                    subsidiaryId,
                    isUsed: false,
                    expiresAt: {
                        gt: new Date(now.getTime() + 30000),
                        lte: new Date(now.getTime() + exports.ATTENDANCE_QR_TTL_MS),
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            if (active && !force)
                return { token: active.token, expiresAt: active.expiresAt };
            await tx.dynamicToken.updateMany({
                where: { subsidiaryId, isUsed: false },
                data: { isUsed: true, usedAt: now },
            });
            const token = await tx.dynamicToken.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    token: (0, crypto_1.randomUUID)(),
                    subsidiaryId,
                    expiresAt: new Date(now.getTime() + exports.ATTENDANCE_QR_TTL_MS),
                    createdAt: now,
                },
            });
            return { token: token.token, expiresAt: token.expiresAt };
        });
    }
    generateToken(subsidiaryId) {
        return this.issue(subsidiaryId, true);
    }
    getActiveToken(subsidiaryId) {
        return this.issue(subsidiaryId, false);
    }
    async validateToken(token, client = this.prisma) {
        const permanent = await client.subsidiaryQrCode.findUnique({
            where: { token },
            select: { subsidiaryId: true, isActive: true },
        });
        if (permanent?.isActive)
            return permanent.subsidiaryId;
        if (permanent) {
            throw new common_1.BadRequestException({
                code: 'QR_REVOKED',
                message: 'Ce QR a été remplacé. Utilisez le QR actuellement affiché dans les locaux.',
            });
        }
        const record = await client.dynamicToken.findUnique({ where: { token } });
        const now = Date.now();
        if (!record ||
            record.isUsed ||
            !record.subsidiaryId ||
            record.expiresAt.getTime() <= now ||
            record.expiresAt.getTime() - record.createdAt.getTime() >
                exports.ATTENDANCE_QR_TTL_MS) {
            throw new common_1.BadRequestException({
                code: 'QR_EXPIRED',
                message: 'QR code invalide ou expiré. Scannez le code actuellement affiché sur place.',
            });
        }
        return record.subsidiaryId;
    }
};
exports.DynamicTokenService = DynamicTokenService;
exports.DynamicTokenService = DynamicTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DynamicTokenService);
//# sourceMappingURL=dynamic-token.service.js.map