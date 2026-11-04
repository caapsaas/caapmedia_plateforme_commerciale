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
exports.NeedRequestsService = void 0;
const node_crypto_1 = require("node:crypto");
const accounting_outbox_service_1 = require("../../accounting/outbox/accounting-outbox.service");
const notifications_service_1 = require("../../notifications/notifications.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const role_identity_1 = require("../../common/auth/role/role-identity");
const need_request_dto_1 = require("./dto/need-request.dto");
const details = {
    payment: {
        include: {
            paidBy: { select: { id: true, userName: true } },
            financialTransaction: {
                select: {
                    treasuryAccount: { select: { id: true, accountName: true } },
                },
            },
        },
    },
    requester: { select: { id: true, userName: true } },
    reviewer: { select: { id: true, userName: true } },
    subsidiary: { select: { id: true, subsidiaryName: true } },
};
let NeedRequestsService = class NeedRequestsService {
    prisma;
    notifications;
    accountingOutbox;
    constructor(prisma, notifications, accountingOutbox) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.accountingOutbox = accountingOutbox;
    }
    assertAccess(user) {
        if (!(0, role_identity_1.isSuperAdmin)(user) && (0, role_identity_1.getActiveRole)(user) !== client_1.UserRole.COMMERCIAL) {
            throw new common_1.ForbiddenException('Accès réservé au commercial et au super-admin.');
        }
    }
    findAll(user) {
        this.assertAccess(user);
        return this.prisma.needRequest.findMany({
            where: (0, role_identity_1.isSuperAdmin)(user)
                ? {}
                : { subsidiaryId: user.subsidiaryId, requesterId: user.id },
            include: details,
            orderBy: { createdAt: 'desc' },
        });
    }
    create(user, dto) {
        if ((0, role_identity_1.getActiveRole)(user) !== client_1.UserRole.COMMERCIAL || (0, role_identity_1.isSuperAdmin)(user)) {
            throw new common_1.ForbiddenException('Seul le commercial peut soumettre une expression de besoin.');
        }
        return this.createAndNotify(user, dto);
    }
    async createAndNotify(user, dto) {
        const result = await this.prisma.$transaction(async (tx) => {
            const request = await tx.needRequest.create({
                data: {
                    ...dto,
                    desiredDate: dto.desiredDate ? new Date(dto.desiredDate) : undefined,
                    subsidiaryId: user.subsidiaryId,
                    requesterId: user.id,
                },
                include: details,
            });
            const admins = await tx.user.findMany({
                where: {
                    OR: [
                        { userRole: client_1.UserRole.SUPER_ADMIN },
                        { roles: { has: client_1.UserRole.SUPER_ADMIN } },
                        { additionalRoles: { has: client_1.UserRole.SUPER_ADMIN } },
                    ],
                },
                select: { id: true },
            });
            const notifications = await Promise.all(admins.map((admin) => this.notifications.createNotification(admin.id, {
                title: 'Nouvelle expression de besoin',
                message: `${request.requester.userName} (${request.subsidiary.subsidiaryName}) a soumis « ${request.title} ».`,
                type: client_1.NotificationType.SYSTEM_ALERT,
                data: {
                    event: 'need.created',
                    requestId: request.id,
                    subsidiaryId: request.subsidiaryId,
                },
            }, tx)));
            return { request, notifications };
        });
        for (const notification of result.notifications)
            this.notifications.publish(notification);
        return result.request;
    }
    assertPayer(user) {
        if (!(0, role_identity_1.isSuperAdmin)(user))
            throw new common_1.ForbiddenException('Seul le super-admin peut régler une expression de besoin.');
    }
    async paymentAccount(user, id) {
        this.assertPayer(user);
        const request = await this.prisma.needRequest.findUnique({ where: { id } });
        if (!request)
            throw new common_1.NotFoundException('Expression de besoin introuvable.');
        return this.resolveExpenseBox(this.prisma, request.subsidiaryId);
    }
    async resolveExpenseBox(tx, subsidiaryId) {
        const accounts = await tx.treasuryAccount.findMany({
            where: { subsidiaryId, accountType: client_1.AccountType.EXPENSE_BOX },
            take: 2,
            select: { id: true, accountName: true, balance: true, currency: true },
        });
        if (!accounts.length)
            throw new common_1.BadRequestException('Aucune caisse de dépense configurée pour la filiale de cette demande.');
        if (accounts.length !== 1)
            throw new common_1.ConflictException('Plusieurs caisses de dépense existent pour cette filiale. Corrigez la configuration avant de régler.');
        return accounts[0];
    }
    async pay(user, id, dto) {
        this.assertPayer(user);
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const result = await this.prisma.$transaction(async (tx) => {
                    const request = await tx.needRequest.findUnique({
                        where: { id },
                        include: { payment: true },
                    });
                    if (!request)
                        throw new common_1.NotFoundException('Expression de besoin introuvable.');
                    if (request.status !== client_1.NeedRequestStatus.APPROVED)
                        throw new common_1.BadRequestException('Seule une expression validée peut être réglée.');
                    if (request.payment)
                        throw new common_1.ConflictException('Cette expression de besoin est déjà réglée.');
                    const account = await this.resolveExpenseBox(tx, request.subsidiaryId);
                    const amount = new client_1.Prisma.Decimal(dto.amount);
                    const debit = await tx.treasuryAccount.updateMany({
                        where: {
                            id: account.id,
                            subsidiaryId: request.subsidiaryId,
                            accountType: client_1.AccountType.EXPENSE_BOX,
                            balance: { gte: amount },
                        },
                        data: { balance: { decrement: amount } },
                    });
                    if (debit.count !== 1)
                        throw new common_1.BadRequestException('Solde insuffisant dans la caisse de dépense de cette filiale.');
                    const updatedAccount = await tx.treasuryAccount.findUniqueOrThrow({
                        where: { id: account.id },
                    });
                    const transaction = await tx.financialTransaction.create({
                        data: {
                            id: (0, node_crypto_1.randomUUID)(),
                            transactionDate: new Date(dto.transactionDate),
                            description: `Règlement expression de besoin : ${request.title}`,
                            amount,
                            relatedDocumentId: request.id,
                            subsidiaryId: request.subsidiaryId,
                            financialTransactionType: client_1.TransactionType.DEPENSE,
                            treasuryAccountId: account.id,
                            sourceAccountId: account.id,
                            status: client_1.TransactionStatus.VALIDE,
                            treasuryType: client_1.TreasuryTransactionType.OTHER_EXPENSE,
                            reference: dto.reference || `BES-${request.id}`,
                            providerName: dto.beneficiary,
                            balanceAfterSource: updatedAccount.balance,
                        },
                    });
                    await tx.needRequestPayment.create({
                        data: {
                            needRequestId: request.id,
                            financialTransactionId: transaction.id,
                            amount,
                            currency: account.currency,
                            beneficiary: dto.beneficiary,
                            category: dto.category,
                            reference: dto.reference || `BES-${request.id}`,
                            paidAt: new Date(dto.transactionDate),
                            paidById: user.id,
                        },
                    });
                    await this.accountingOutbox.enqueue(tx, {
                        eventType: 'TREASURY_EXPENSE',
                        subsidiaryId: request.subsidiaryId,
                        payload: {
                            userId: user.id,
                            operationDate: new Date(dto.transactionDate).toISOString(),
                            amount: dto.amount,
                            description: transaction.description,
                            sourceId: transaction.id,
                            accountType: client_1.AccountType.EXPENSE_BOX,
                            expenseCategory: dto.category,
                            withTva: false,
                        },
                    });
                    const notification = await this.notifications.createNotification(request.requesterId, {
                        title: 'Expression de besoin réglée',
                        message: `Votre demande « ${request.title} » a été réglée à hauteur de ${amount.toString()} ${account.currency} depuis la caisse de dépense.`,
                        type: client_1.NotificationType.SYSTEM_ALERT,
                        data: {
                            event: 'need.paid',
                            requestId: request.id,
                            subsidiaryId: request.subsidiaryId,
                        },
                    }, tx);
                    return {
                        request: await tx.needRequest.findUniqueOrThrow({
                            where: { id },
                            include: details,
                        }),
                        notification,
                    };
                }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
                this.notifications.publish(result.notification);
                return result.request;
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    if (error.code === 'P2034' && attempt < 2)
                        continue;
                    if (error.code === 'P2002')
                        throw new common_1.ConflictException('Cette expression de besoin est déjà réglée.');
                    if (error.code === 'P2034')
                        throw new common_1.ConflictException('Un autre paiement est en cours. Veuillez actualiser puis réessayer.');
                }
                throw error;
            }
        }
        throw new common_1.ConflictException('Impossible de finaliser le paiement.');
    }
    async review(user, id, dto) {
        if (!(0, role_identity_1.isSuperAdmin)(user))
            throw new common_1.ForbiddenException('Décision réservée au super-admin.');
        if (dto.status === need_request_dto_1.NeedDecision.REJECTED && !dto.rejectionReason?.trim()) {
            throw new common_1.BadRequestException('Le motif de rejet est obligatoire.');
        }
        const reviewed = await this.prisma.$transaction(async (tx) => {
            const request = await tx.needRequest.findUnique({ where: { id } });
            if (!request)
                throw new common_1.NotFoundException('Expression de besoin introuvable.');
            const result = await tx.needRequest.updateMany({
                where: {
                    id,
                    subsidiaryId: request.subsidiaryId,
                    status: client_1.NeedRequestStatus.PENDING,
                },
                data: {
                    status: dto.status,
                    reviewerId: user.id,
                    reviewedAt: new Date(),
                    rejectionReason: dto.status === need_request_dto_1.NeedDecision.REJECTED
                        ? dto.rejectionReason.trim()
                        : null,
                },
            });
            if (!result.count)
                throw new common_1.ConflictException('Cette demande a déjà été traitée.');
            const updated = await tx.needRequest.findUniqueOrThrow({
                where: { id },
                include: details,
            });
            const rejected = dto.status === need_request_dto_1.NeedDecision.REJECTED;
            const notification = await this.notifications.createNotification(request.requesterId, {
                title: rejected
                    ? 'Expression de besoin rejetée'
                    : 'Expression de besoin validée',
                message: rejected
                    ? `Votre demande « ${request.title} » a été rejetée. Motif : ${updated.rejectionReason}`
                    : `Votre demande « ${request.title} » a été validée par le super-admin.`,
                type: client_1.NotificationType.SYSTEM_ALERT,
                data: {
                    event: rejected ? 'need.rejected' : 'need.approved',
                    requestId: request.id,
                    subsidiaryId: request.subsidiaryId,
                },
            }, tx);
            return { request: updated, notification };
        });
        this.notifications.publish(reviewed.notification);
        return reviewed.request;
    }
};
exports.NeedRequestsService = NeedRequestsService;
exports.NeedRequestsService = NeedRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        accounting_outbox_service_1.AccountingOutboxService])
], NeedRequestsService);
//# sourceMappingURL=need-requests.service.js.map