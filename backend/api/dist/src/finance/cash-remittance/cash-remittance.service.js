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
exports.CashRemittanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const check_role_util_1 = require("../../common/auth/role/check-role.util");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
const accounting_outbox_service_1 = require("../../accounting/outbox/accounting-outbox.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const REMITTANCE_INCLUDE = {
    createdByUser: { select: { userName: true } },
    receivedByUser: { select: { userName: true } },
    sourceCashRegister: true,
    destinationSafe: true,
};
let CashRemittanceService = class CashRemittanceService {
    prisma;
    accountingOutbox;
    constructor(prisma, accountingOutbox) {
        this.prisma = prisma;
        this.accountingOutbox = accountingOutbox;
    }
    async create(dto, user) {
        const activeRole = user.activeRole ?? user.role;
        if (activeRole !== client_1.UserRole.CAISSIER) {
            throw new common_1.ForbiddenException('Seul un caissier peut initier une remise de caisse.');
        }
        return this.prisma.$transaction(async (tx) => {
            const sourceAccount = await tx.treasuryAccount.findFirst({
                where: {
                    cashierId: user.id,
                    subsidiaryId: user.subsidiaryId,
                    accountType: client_1.AccountType.CASH_REGISTER,
                },
            });
            if (!sourceAccount) {
                throw new common_1.NotFoundException("Aucune caisse n'est associée à votre compte. Contactez l'administrateur.");
            }
            const declaredAmount = new client_1.Prisma.Decimal(dto.declaredAmount);
            if (sourceAccount.balance.comparedTo(declaredAmount) < 0) {
                throw new common_1.BadRequestException(`Le montant déclaré (${dto.declaredAmount}) dépasse le solde de la caisse (${Number(sourceAccount.balance)}).`);
            }
            const headquarter = await tx.subsidiary.findFirst({
                where: { isHeadquarter: true },
            });
            if (!headquarter) {
                throw new common_1.NotFoundException("Le siège n'a pas été configuré.");
            }
            const destinationSafe = await tx.treasuryAccount.findFirst({
                where: {
                    subsidiaryId: headquarter.id,
                    accountType: client_1.AccountType.SAFE,
                },
            });
            if (!destinationSafe) {
                throw new common_1.NotFoundException("Aucun compte de type Coffre-fort n'a été trouvé pour le siège.");
            }
            const year = new Date().getFullYear();
            const count = await tx.cashRemittance.count();
            const reference = `RC-${year}-${String(count + 1).padStart(4, '0')}`;
            const remittance = await tx.cashRemittance.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.CASHREMITTANCE),
                    reference,
                    declaredAmount,
                    remittanceDate: new Date(dto.remittanceDate),
                    status: client_1.CashRemittanceStatus.SUBMITTED,
                    notes: dto.notes,
                    sourceCashRegisterId: sourceAccount.id,
                    destinationSafeId: destinationSafe.id,
                    subsidiaryId: user.subsidiaryId,
                    createdByUserId: user.id,
                },
                include: REMITTANCE_INCLUDE,
            });
            return remittance;
        });
    }
    async findAll(user) {
        const activeRole = user.activeRole ?? user.role;
        const isSuperAdmin = (user.roles ?? [user.role]).includes(client_1.UserRole.SUPER_ADMIN);
        const where = {};
        if (!isSuperAdmin) {
            if (activeRole === client_1.UserRole.CAISSIER) {
                where.createdByUserId = user.id;
            }
            else {
                where.subsidiaryId = user.subsidiaryId;
            }
        }
        return this.prisma.cashRemittance.findMany({
            where,
            include: REMITTANCE_INCLUDE,
            orderBy: { createdAt: 'desc' },
        });
    }
    async receive(id, dto, user) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.FINANCIAL_DIRECTOR], 'Seul le directeur financier peut réceptionner une remise de caisse.');
        return this.prisma.$transaction(async (tx) => {
            const remittance = await tx.cashRemittance.findUnique({
                where: { id },
            });
            if (!remittance) {
                throw new common_1.NotFoundException(`Remise de caisse avec l'ID "${id}" introuvable.`);
            }
            (0, subsidiary_scope_1.assertSubsidiaryAccess)(remittance.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(user));
            if (remittance.status !== client_1.CashRemittanceStatus.SUBMITTED) {
                throw new common_1.BadRequestException(`Cette remise ne peut pas être réceptionnée (statut actuel : ${remittance.status}).`);
            }
            const receivedAmount = new client_1.Prisma.Decimal(dto.receivedAmount);
            const discrepancy = receivedAmount.minus(remittance.declaredAmount);
            const newStatus = discrepancy.isZero()
                ? client_1.CashRemittanceStatus.RECEIVED
                : client_1.CashRemittanceStatus.RECEIVED_WITH_DISCREPANCY;
            const updatedSource = await tx.treasuryAccount.update({
                where: { id: remittance.sourceCashRegisterId },
                data: { balance: { decrement: remittance.declaredAmount } },
            });
            const updatedDest = await tx.treasuryAccount.update({
                where: { id: remittance.destinationSafeId },
                data: { balance: { increment: receivedAmount } },
            });
            const transaction = await tx.financialTransaction.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.TREASURY),
                    description: `Versement remise de caisse ${remittance.reference}`,
                    amount: receivedAmount,
                    financialTransactionType: client_1.TransactionType.DEPENSE,
                    treasuryAccountId: remittance.sourceCashRegisterId,
                    sourceAccountId: remittance.sourceCashRegisterId,
                    destinationAccountId: remittance.destinationSafeId,
                    reference: remittance.reference,
                    subsidiaryId: remittance.subsidiaryId,
                    transactionDate: new Date(),
                    status: client_1.TransactionStatus.VALIDE,
                    balanceAfterSource: updatedSource.balance,
                    balanceAfterDest: updatedDest.balance,
                },
            });
            await this.accountingOutbox.enqueue(tx, {
                eventType: 'TREASURY_TRANSFER',
                subsidiaryId: remittance.subsidiaryId,
                payload: {
                    userId: user.id,
                    operationDate: new Date().toISOString(),
                    amount: Number(receivedAmount),
                    description: `Versement remise de caisse ${remittance.reference}`,
                    sourceId: transaction.id,
                    accountType: client_1.AccountType.CASH_REGISTER,
                    destinationAccountType: client_1.AccountType.SAFE,
                },
            });
            await tx.cashRemittance.update({
                where: { id },
                data: {
                    status: newStatus,
                    receivedAmount,
                    discrepancy,
                    notes: dto.notes ?? remittance.notes,
                    receivedByUserId: user.id,
                },
            });
            return tx.cashRemittance.findUnique({
                where: { id },
                include: REMITTANCE_INCLUDE,
            });
        });
    }
};
exports.CashRemittanceService = CashRemittanceService;
exports.CashRemittanceService = CashRemittanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        accounting_outbox_service_1.AccountingOutboxService])
], CashRemittanceService);
//# sourceMappingURL=cash-remittance.service.js.map