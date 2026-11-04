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
exports.AccountingAccessService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/utils/prisma/prisma.service");
const email_service_1 = require("../common/utils/email/email.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../common/constants/id-prefixes.const");
const approve_access_request_dto_1 = require("./dto/approve-access-request.dto");
const pagination_1 = require("../common/pagination/pagination");
let AccountingAccessService = class AccountingAccessService {
    prisma;
    emailService;
    notificationsService;
    constructor(prisma, emailService, notificationsService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.notificationsService = notificationsService;
    }
    async isHeadquarterAdmin(user) {
        const roles = user.roles?.length ? user.roles : [user.role];
        if (roles.includes(client_1.UserRole.SUPER_ADMIN))
            return true;
        const activeRole = user.activeRole ?? user.role;
        if (activeRole !== client_1.UserRole.ADMIN)
            return false;
        const subsidiary = await this.prisma.subsidiary.findUnique({
            where: { id: user.subsidiaryId },
            select: { isHeadquarter: true },
        });
        return subsidiary?.isHeadquarter ?? false;
    }
    async hasActiveAccess(user) {
        if (await this.isHeadquarterAdmin(user))
            return true;
        const active = await this.prisma.accountingAccessRequest.findFirst({
            where: {
                userId: user.id,
                status: client_1.AccountingAccessStatus.APPROVED,
                expiresAt: { gt: new Date() },
            },
        });
        return !!active;
    }
    async createRequest(user, dto) {
        if (await this.isHeadquarterAdmin(user)) {
            throw new common_1.BadRequestException('Vous avez déjà un accès permanent à la comptabilité.');
        }
        if (await this.hasActiveAccess(user)) {
            throw new common_1.BadRequestException('Vous avez déjà un accès actif à la comptabilité.');
        }
        const pending = await this.prisma.accountingAccessRequest.findFirst({
            where: { userId: user.id, status: client_1.AccountingAccessStatus.PENDING },
        });
        if (pending) {
            throw new common_1.BadRequestException('Une demande est déjà en attente de validation.');
        }
        const request = await this.prisma.accountingAccessRequest.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ACCOUNTINGACCESSREQUEST),
                userId: user.id,
                justification: dto.justification,
            },
            include: { user: { select: { userName: true, email: true } } },
        });
        await this.notifyHeadquarterAdmins(request);
        return request;
    }
    async approve(id, dto, reviewer) {
        if (!(await this.isHeadquarterAdmin(reviewer))) {
            throw new common_1.ForbiddenException('Seul un ADMIN du siège peut approuver un accès comptabilité.');
        }
        const request = await this.prisma.accountingAccessRequest.findUnique({
            where: { id },
            include: { user: { select: { userName: true, email: true } } },
        });
        if (!request)
            throw new common_1.NotFoundException(`Demande "${id}" introuvable.`);
        if (request.status !== client_1.AccountingAccessStatus.PENDING) {
            throw new common_1.BadRequestException('Cette demande a déjà été traitée.');
        }
        const hours = dto.unit === approve_access_request_dto_1.AccessDurationUnit.DAYS ? dto.duration * 24 : dto.duration;
        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
        const updated = await this.prisma.accountingAccessRequest.update({
            where: { id },
            data: {
                status: client_1.AccountingAccessStatus.APPROVED,
                reviewedBy: reviewer.id,
                reviewedAt: new Date(),
                expiresAt,
            },
        });
        await this.notificationsService.notifyUser(request.userId, {
            title: 'Accès comptabilité approuvé',
            message: `Votre accès temporaire à la comptabilité est approuvé jusqu'au ${expiresAt.toLocaleString('fr-FR')}.`,
            type: client_1.NotificationType.ACCOUNTING_ACCESS_APPROVED,
            data: { requestId: request.id, expiresAt: expiresAt.toISOString() },
        });
        this.emailService.sendAccountingAccessNotificationEmail(request.user.email, request.user.userName, 'Accès comptabilité approuvé', `Votre demande d'accès à la comptabilité a été approuvée jusqu'au ${expiresAt.toLocaleString('fr-FR')}.`);
        return updated;
    }
    async reject(id, dto, reviewer) {
        if (!(await this.isHeadquarterAdmin(reviewer))) {
            throw new common_1.ForbiddenException('Seul un ADMIN du siège peut refuser un accès comptabilité.');
        }
        const request = await this.prisma.accountingAccessRequest.findUnique({
            where: { id },
            include: { user: { select: { userName: true, email: true } } },
        });
        if (!request)
            throw new common_1.NotFoundException(`Demande "${id}" introuvable.`);
        if (request.status !== client_1.AccountingAccessStatus.PENDING) {
            throw new common_1.BadRequestException('Cette demande a déjà été traitée.');
        }
        const updated = await this.prisma.accountingAccessRequest.update({
            where: { id },
            data: {
                status: client_1.AccountingAccessStatus.REJECTED,
                reviewedBy: reviewer.id,
                reviewedAt: new Date(),
                rejectionNote: dto.rejectionNote,
            },
        });
        await this.notificationsService.notifyUser(request.userId, {
            title: 'Accès comptabilité refusé',
            message: dto.rejectionNote
                ? `Votre demande d'accès à la comptabilité a été refusée : ${dto.rejectionNote}`
                : "Votre demande d'accès à la comptabilité a été refusée.",
            type: client_1.NotificationType.ACCOUNTING_ACCESS_REJECTED,
            data: { requestId: request.id },
        });
        this.emailService.sendAccountingAccessNotificationEmail(request.user.email, request.user.userName, 'Accès comptabilité refusé', dto.rejectionNote
            ? `Votre demande d'accès à la comptabilité a été refusée : ${dto.rejectionNote}`
            : "Votre demande d'accès à la comptabilité a été refusée.");
        return updated;
    }
    async findAll(user, paginationQuery = {}) {
        const isHqAdmin = await this.isHeadquarterAdmin(user);
        return (0, pagination_1.paginate)(this.prisma.accountingAccessRequest, {
            where: isHqAdmin ? {} : { userId: user.id },
            orderBy: { requestedAt: 'desc' },
            include: {
                user: { select: { userName: true, email: true } },
                reviewer: { select: { userName: true } },
            },
        }, paginationQuery);
    }
    async countPending(user) {
        if (!(await this.isHeadquarterAdmin(user)))
            return 0;
        return this.prisma.accountingAccessRequest.count({
            where: { status: client_1.AccountingAccessStatus.PENDING },
        });
    }
    async myStatus(user) {
        if (await this.isHeadquarterAdmin(user)) {
            return { hasAccess: true, reason: 'HEADQUARTER_ADMIN' };
        }
        const active = await this.prisma.accountingAccessRequest.findFirst({
            where: {
                userId: user.id,
                status: client_1.AccountingAccessStatus.APPROVED,
                expiresAt: { gt: new Date() },
            },
            orderBy: { expiresAt: 'desc' },
        });
        if (active) {
            return {
                hasAccess: true,
                reason: 'APPROVED',
                expiresAt: active.expiresAt,
            };
        }
        const pending = await this.prisma.accountingAccessRequest.findFirst({
            where: { userId: user.id, status: client_1.AccountingAccessStatus.PENDING },
        });
        if (pending) {
            return {
                hasAccess: false,
                reason: 'PENDING',
                requestId: pending.id,
            };
        }
        return { hasAccess: false, reason: 'NONE' };
    }
    async notifyHeadquarterAdmins(request) {
        const admins = await this.prisma.user.findMany({
            where: {
                subsidiary: { isHeadquarter: true },
                OR: [{ userRole: client_1.UserRole.ADMIN }, { roles: { has: client_1.UserRole.ADMIN } }],
            },
        });
        for (const admin of admins) {
            await this.notificationsService.notifyUser(admin.id, {
                title: "Nouvelle demande d'accès comptabilité",
                message: `${request.user.userName} demande un accès temporaire à la comptabilité : "${request.justification}"`,
                type: client_1.NotificationType.ACCOUNTING_ACCESS_REQUESTED,
                data: { requestId: request.id },
            });
            this.emailService.sendAccountingAccessNotificationEmail(admin.email, admin.userName, "Nouvelle demande d'accès comptabilité", `${request.user.userName} demande un accès temporaire à la comptabilité.\n\nJustification : ${request.justification}`);
        }
    }
};
exports.AccountingAccessService = AccountingAccessService;
exports.AccountingAccessService = AccountingAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        notifications_service_1.NotificationsService])
], AccountingAccessService);
//# sourceMappingURL=accounting-access.service.js.map