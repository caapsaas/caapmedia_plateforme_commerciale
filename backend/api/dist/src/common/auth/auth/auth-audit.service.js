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
exports.AuthAuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../utils/prisma/prisma.service");
const logger_service_1 = require("../../utils/logger/logger.service");
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;
let AuthAuditService = class AuthAuditService {
    prisma;
    logger;
    constructor(prisma, logger) {
        this.prisma = prisma;
        this.logger = logger;
    }
    async log(event, entry) {
        try {
            await this.prisma.authAuditLog.create({
                data: {
                    event,
                    userId: entry.userId,
                    email: entry.email,
                    ipAddress: entry.ipAddress,
                    userAgent: entry.userAgent,
                },
            });
        }
        catch (error) {
            this.logger.error(`Echec d'ecriture du journal d'audit pour ${event}: ${error}`, 'AuthAuditService');
        }
    }
    async findMany(query) {
        const take = Math.min(query.take ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const skip = query.skip ?? 0;
        const where = {
            ...(query.userId ? { userId: query.userId } : {}),
            ...(query.email
                ? { email: { contains: query.email, mode: 'insensitive' } }
                : {}),
            ...(query.event ? { event: query.event } : {}),
        };
        const [entries, total] = await Promise.all([
            this.prisma.authAuditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take,
                skip,
            }),
            this.prisma.authAuditLog.count({ where }),
        ]);
        return { entries, total, take, skip };
    }
};
exports.AuthAuditService = AuthAuditService;
exports.AuthAuditService = AuthAuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logger_service_1.LoggerService])
], AuthAuditService);
//# sourceMappingURL=auth-audit.service.js.map