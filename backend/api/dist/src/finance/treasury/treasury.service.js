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
var TreasuryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreasuryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const check_role_util_1 = require("../../common/auth/role/check-role.util");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
const accounting_outbox_service_1 = require("../../accounting/outbox/accounting-outbox.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
let TreasuryService = class TreasuryService {
    static { TreasuryService_1 = this; }
    prisma;
    accountingOutbox;
    constructor(prisma, accountingOutbox) {
        this.prisma = prisma;
        this.accountingOutbox = accountingOutbox;
    }
    static CASHIER_ASSIGNABLE_TYPES = [
        client_1.AccountType.CASH_REGISTER,
        client_1.AccountType.EXPENSE_BOX,
    ];
    async validateCashierAssignment(cashierId, accountType, subsidiaryId) {
        if (!TreasuryService_1.CASHIER_ASSIGNABLE_TYPES.includes(accountType)) {
            throw new common_1.BadRequestException("Un caissier ne peut être assigné qu'à un compte de type Caisse, Caisse de vente ou Caisse de dépense.");
        }
        const targetUser = await this.prisma.user.findUnique({
            where: { id: cashierId },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException(`Utilisateur caissier avec l'ID "${cashierId}" non trouvé.`);
        }
        const hasCashierRole = targetUser.userRole === client_1.UserRole.CAISSIER ||
            targetUser.roles?.includes(client_1.UserRole.CAISSIER) ||
            targetUser.additionalRoles?.includes(client_1.UserRole.CAISSIER);
        if (!hasCashierRole) {
            throw new common_1.BadRequestException(`L'utilisateur "${targetUser.userName}" n'a pas le rôle Caissier.`);
        }
        if (targetUser.subsidiaryId !== subsidiaryId) {
            throw new common_1.BadRequestException("Un caissier ne peut être assigné qu'à une caisse de sa filiale.");
        }
    }
    async createAccount(dto, user) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'Permission denied to create treasury accounts.');
        let targetSubsidiaryId;
        if (dto.accountType === client_1.AccountType.BANQUE ||
            dto.accountType === client_1.AccountType.SAFE) {
            if (dto.accountType === client_1.AccountType.BANQUE && !dto.bankId) {
                throw new common_1.BadRequestException('La banque est requise pour un compte de type Banque.');
            }
            if (dto.accountType === client_1.AccountType.BANQUE) {
                const bank = await this.prisma.bank.findUnique({
                    where: { id: dto.bankId },
                });
                if (!bank) {
                    throw new common_1.NotFoundException(`Banque avec l'ID "${dto.bankId}" introuvable.`);
                }
            }
            const headquarter = await this.prisma.subsidiary.findFirst({
                where: { isHeadquarter: true },
            });
            if (!headquarter) {
                throw new common_1.NotFoundException('Impossible de trouver la filiale siège pour rattacher ce compte.');
            }
            targetSubsidiaryId = headquarter.id;
        }
        else {
            const isSuperAdmin = (user.roles ?? [user.role]).includes(client_1.UserRole.SUPER_ADMIN);
            const activeRole = user.activeRole ?? user.role;
            if (isSuperAdmin || activeRole === client_1.UserRole.ADMIN) {
                targetSubsidiaryId = dto.subsidiaryId || user.subsidiaryId;
            }
            else {
                if (dto.subsidiaryId && dto.subsidiaryId !== user.subsidiaryId) {
                    throw new common_1.ForbiddenException("Vous n'êtes pas autorisé à créer un compte pour une autre filiale.");
                }
                targetSubsidiaryId = user.subsidiaryId;
            }
        }
        const existingAccount = await this.prisma.treasuryAccount.findFirst({
            where: { accountName: dto.accountName, subsidiaryId: targetSubsidiaryId },
        });
        if (existingAccount) {
            throw new common_1.ConflictException(`Un compte de trésorerie avec le nom "${dto.accountName}" existe déjà dans cette filiale.`);
        }
        if (dto.accountType === client_1.AccountType.COMPTE_PREFINANCEMENT) {
            const existing = await this.prisma.treasuryAccount.findFirst({
                where: {
                    subsidiaryId: targetSubsidiaryId,
                    accountType: client_1.AccountType.COMPTE_PREFINANCEMENT,
                },
            });
            if (existing) {
                throw new common_1.BadRequestException(`Un compte de préfinancement existe déjà pour cette filiale (${existing.accountName}).`);
            }
        }
        if (dto.accountType === client_1.AccountType.EXPENSE_BOX) {
            const existingExpenseBox = await this.prisma.treasuryAccount.findFirst({
                where: {
                    accountType: client_1.AccountType.EXPENSE_BOX,
                    subsidiaryId: targetSubsidiaryId,
                },
            });
            if (existingExpenseBox) {
                throw new common_1.ConflictException(`Une caisse de dépense ("${existingExpenseBox.accountName}") existe déjà pour cette filiale. Une filiale ne peut avoir qu'une seule caisse de dépense.`);
            }
        }
        if (dto.cashierId) {
            await this.validateCashierAssignment(dto.cashierId, dto.accountType, targetSubsidiaryId);
        }
        const initialBalance = dto.initialBalance || 0;
        const accountId = (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.TREASURY);
        return this.prisma.$transaction(async (tx) => {
            await tx.treasuryAccount.create({
                data: {
                    id: accountId,
                    accountName: dto.accountName,
                    balance: new client_1.Prisma.Decimal(0),
                    initialBalance: new client_1.Prisma.Decimal(initialBalance),
                    currency: dto.currency,
                    accountType: dto.accountType,
                    subsidiaryId: targetSubsidiaryId,
                    cashierId: dto.cashierId,
                    accountCode: dto.accountCode,
                    accountNumber: dto.accountNumber,
                    bankId: dto.accountType === client_1.AccountType.BANQUE ? dto.bankId : undefined,
                },
            });
            if (initialBalance > 0) {
                await tx.financialTransaction.create({
                    data: {
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.TREASURY),
                        transactionDate: new Date(),
                        description: 'Solde initial',
                        amount: new client_1.Prisma.Decimal(initialBalance),
                        financialTransactionType: client_1.TransactionType.RECETTE,
                        treasuryAccountId: accountId,
                        destinationAccountId: accountId,
                        sourceAccountId: null,
                        status: client_1.TransactionStatus.VALIDE,
                        treasuryType: client_1.TreasuryTransactionType.CASH_REFILL,
                        balanceAfterDest: new client_1.Prisma.Decimal(initialBalance),
                        subsidiaryId: targetSubsidiaryId,
                        reference: `INIT-${accountId}`,
                    },
                });
                await tx.treasuryAccount.update({
                    where: { id: accountId },
                    data: { balance: new client_1.Prisma.Decimal(initialBalance) },
                });
            }
            const created = await tx.treasuryAccount.findUnique({
                where: { id: accountId },
                include: { bank: true },
            });
            return { ...created, balance: Number(created.balance) };
        });
    }
    async findAllAccounts(user, subsidiaryId) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user);
        const accounts = await this.prisma.treasuryAccount.findMany({
            where: (0, subsidiary_scope_1.withSubsidiaryScope)({}, ctx, subsidiaryId),
            include: {
                bank: true,
                subsidiary: { select: { id: true, subsidiaryName: true } },
            },
            orderBy: { accountName: 'asc' },
        });
        return accounts.map((account) => ({
            ...account,
            balance: Number(account.balance),
        }));
    }
    async findOneAccount(id, user) {
        const account = await this.prisma.treasuryAccount.findFirst({
            where: { id },
            include: { bank: true },
        });
        if (!account) {
            throw new common_1.NotFoundException(`Treasury account with ID "${id}" not found.`);
        }
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(account.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(user));
        return { ...account, balance: Number(account.balance) };
    }
    async updateAccount(id, dto, user) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN], 'Permission denied to update treasury accounts.');
        const account = await this.findOneAccount(id, user);
        if (dto.cashierId) {
            await this.validateCashierAssignment(dto.cashierId, account.accountType, account.subsidiaryId);
        }
        return this.prisma.treasuryAccount.update({ where: { id }, data: dto });
    }
    async deleteAccount(id, user) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN], 'Permission denied to delete treasury accounts.');
        const account = await this.prisma.treasuryAccount.findFirst({
            where: { id },
            include: { _count: { select: { financialTransactions: true } } },
        });
        if (!account) {
            throw new common_1.NotFoundException(`Treasury account with ID "${id}" not found.`);
        }
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(account.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(user));
        if (account._count.financialTransactions > 0) {
            throw new common_1.BadRequestException('Cannot delete an account with existing transactions.');
        }
        return this.prisma.treasuryAccount.delete({ where: { id } });
    }
    async findPrefinancementAccount(subsidiaryId) {
        return this.prisma.treasuryAccount.findFirst({
            where: { subsidiaryId, accountType: client_1.AccountType.COMPTE_PREFINANCEMENT },
        });
    }
    async getOrCreatePrefinancementAccount(subsidiaryId, user) {
        const existing = await this.findPrefinancementAccount(subsidiaryId);
        if (existing)
            return existing;
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'Permission denied to create prefinancement accounts.');
        return this.prisma.treasuryAccount.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.TREASURY),
                accountName: 'Compte de Préfinancement',
                balance: new client_1.Prisma.Decimal(0),
                currency: 'XOF',
                accountType: client_1.AccountType.COMPTE_PREFINANCEMENT,
                subsidiaryId,
            },
        });
    }
    async createIncomeTransaction(dto, user) {
        return this.createTransaction(dto, user, client_1.TransactionType.RECETTE);
    }
    async createExpenseTransaction(dto, user) {
        return this.createTransaction(dto, user, client_1.TransactionType.DEPENSE);
    }
    async createTransaction(dto, user, financialTransactionType) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.CAISSIER], 'Permission denied to create transactions.');
        const { treasuryAccountId, amount, transactionDate } = dto;
        const decimalAmount = new client_1.Prisma.Decimal(amount);
        const isPending = dto.status === client_1.TransactionStatus.EN_ATTENTE;
        return this.prisma.$transaction(async (tx) => {
            const account = await tx.treasuryAccount.findFirst({
                where: { id: treasuryAccountId, subsidiaryId: user.subsidiaryId },
            });
            if (!account) {
                throw new common_1.NotFoundException(`Treasury account with ID "${treasuryAccountId}" not found.`);
            }
            if (!isPending && financialTransactionType === client_1.TransactionType.DEPENSE) {
                if (account.balance.comparedTo(decimalAmount) < 0) {
                    throw new common_1.BadRequestException(`Solde insuffisant sur "${account.accountName}". Solde: ${account.balance}, Montant: ${decimalAmount}.`);
                }
            }
            let balanceAfterSource;
            if (!isPending) {
                const balanceOp = financialTransactionType === client_1.TransactionType.RECETTE
                    ? { increment: decimalAmount }
                    : { decrement: decimalAmount };
                const updated = await tx.treasuryAccount.update({
                    where: { id: treasuryAccountId },
                    data: { balance: balanceOp },
                });
                balanceAfterSource = updated.balance;
            }
            const transaction = await tx.financialTransaction.create({
                data: {
                    description: dto.description,
                    relatedDocumentId: dto.relatedDocumentId,
                    amount: decimalAmount,
                    financialTransactionType,
                    treasuryAccountId,
                    subsidiaryId: user.subsidiaryId,
                    transactionDate: new Date(transactionDate),
                    providerName: dto.providerName,
                    providerPhone: dto.providerPhone,
                    status: isPending
                        ? client_1.TransactionStatus.EN_ATTENTE
                        : client_1.TransactionStatus.VALIDE,
                    balanceAfterSource,
                },
            });
            if (!isPending) {
                await this.accountingOutbox.enqueue(tx, {
                    eventType: financialTransactionType === client_1.TransactionType.RECETTE
                        ? 'TREASURY_INCOME'
                        : 'TREASURY_EXPENSE',
                    subsidiaryId: user.subsidiaryId,
                    payload: {
                        userId: user.id,
                        operationDate: new Date(transactionDate).toISOString(),
                        amount: Number(decimalAmount),
                        description: dto.description,
                        sourceId: transaction.id,
                        accountType: account.accountType,
                    },
                });
            }
            return transaction;
        });
    }
    async updateTransactionStatus(id, dto, user) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'Permission denied to validate transactions.');
        if (dto.status !== client_1.TransactionStatus.VALIDE) {
            throw new common_1.BadRequestException('Seule la transition vers VALIDE est prise en charge.');
        }
        return this.prisma.$transaction(async (tx) => {
            const isSuperAdmin = user.role === client_1.UserRole.SUPER_ADMIN;
            const transaction = await tx.financialTransaction.findFirst({
                where: {
                    id,
                    ...(isSuperAdmin ? {} : { subsidiaryId: user.subsidiaryId }),
                },
                include: { treasuryAccount: true },
            });
            if (!transaction) {
                throw new common_1.NotFoundException(`Transaction with ID "${id}" not found.`);
            }
            if (transaction.status !== client_1.TransactionStatus.EN_ATTENTE) {
                throw new common_1.BadRequestException('Seule une transaction EN_ATTENTE peut être validée.');
            }
            if (transaction.financialTransactionType === client_1.TransactionType.DEPENSE &&
                transaction.treasuryAccount.balance.comparedTo(transaction.amount) < 0) {
                throw new common_1.BadRequestException(`Solde insuffisant sur "${transaction.treasuryAccount.accountName}" pour valider ce décaissement.`);
            }
            const balanceOp = transaction.financialTransactionType === client_1.TransactionType.RECETTE
                ? { increment: transaction.amount }
                : { decrement: transaction.amount };
            const updatedAccount = await tx.treasuryAccount.update({
                where: { id: transaction.treasuryAccountId },
                data: { balance: balanceOp },
            });
            const updatedTransaction = await tx.financialTransaction.update({
                where: { id },
                data: {
                    status: client_1.TransactionStatus.VALIDE,
                    balanceAfterSource: updatedAccount.balance,
                },
            });
            await this.accountingOutbox.enqueue(tx, {
                eventType: transaction.financialTransactionType === client_1.TransactionType.RECETTE
                    ? 'TREASURY_INCOME'
                    : 'TREASURY_EXPENSE',
                subsidiaryId: user.subsidiaryId,
                payload: {
                    userId: user.id,
                    operationDate: transaction.transactionDate.toISOString(),
                    amount: Number(transaction.amount),
                    description: transaction.description,
                    sourceId: transaction.id,
                    accountType: transaction.treasuryAccount.accountType,
                },
            });
            return updatedTransaction;
        });
    }
    static TRANSFER_TREASURY_TYPES = [
        client_1.TreasuryTransactionType.BANK_WITHDRAWAL,
        client_1.TreasuryTransactionType.CASH_REFILL,
    ];
    async createDisbursement(dto, user) {
        const isTransfer = !!dto.destinationAccountId;
        const isTransferType = TreasuryService_1.TRANSFER_TREASURY_TYPES.includes(dto.treasuryType);
        if (isTransfer && !isTransferType) {
            throw new common_1.BadRequestException(`Le type "${dto.treasuryType}" ne correspond pas à un virement inter-comptes.`);
        }
        if (!isTransfer && isTransferType) {
            throw new common_1.BadRequestException('Un compte de destination est requis pour ce type de mouvement.');
        }
        const decimalAmount = new client_1.Prisma.Decimal(dto.amount);
        const isPending = dto.status === client_1.TransactionStatus.EN_ATTENTE;
        return this.prisma.$transaction(async (tx) => {
            const sourceAccount = await tx.treasuryAccount.findFirst({
                where: { id: dto.sourceAccountId },
            });
            if (!sourceAccount) {
                throw new common_1.NotFoundException(`Treasury account with ID "${dto.sourceAccountId}" not found.`);
            }
            if (sourceAccount.accountType === client_1.AccountType.CASH_REGISTER) {
                throw new common_1.BadRequestException('Aucun décaissement direct depuis une caisse — utilisez une remise de caisse.');
            }
            if (sourceAccount.accountType === client_1.AccountType.SAFE ||
                sourceAccount.accountType === client_1.AccountType.BANQUE) {
                (0, check_role_util_1.checkRole)(user, [], 'Seul le super-administrateur peut décaisser depuis le coffre-fort ou une banque.');
            }
            else if (sourceAccount.accountType === client_1.AccountType.EXPENSE_BOX) {
                (0, check_role_util_1.checkRole)(user, [client_1.UserRole.FINANCIAL_DIRECTOR], 'Seul le directeur financier peut décaisser depuis la caisse dépense.');
                (0, subsidiary_scope_1.assertSubsidiaryAccess)(sourceAccount.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(user));
            }
            else {
                (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'Permission denied to create a disbursement.');
                (0, subsidiary_scope_1.assertSubsidiaryAccess)(sourceAccount.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(user));
            }
            if (!isPending && sourceAccount.balance.comparedTo(decimalAmount) < 0) {
                throw new common_1.BadRequestException(`Solde insuffisant sur "${sourceAccount.accountName}".`);
            }
            let destinationAccount = null;
            if (isTransfer) {
                destinationAccount = await tx.treasuryAccount.findFirst({
                    where: { id: dto.destinationAccountId },
                });
                if (!destinationAccount) {
                    throw new common_1.NotFoundException(`Treasury account with ID "${dto.destinationAccountId}" not found.`);
                }
            }
            const transactionSubsidiaryId = sourceAccount.subsidiaryId;
            const counterpartyId = await this.resolveCounterparty(tx, transactionSubsidiaryId, dto);
            let balanceAfterSource;
            let balanceAfterDest;
            if (!isPending) {
                const updatedSource = await tx.treasuryAccount.update({
                    where: { id: sourceAccount.id },
                    data: { balance: { decrement: decimalAmount } },
                });
                balanceAfterSource = updatedSource.balance;
                if (destinationAccount) {
                    const updatedDest = await tx.treasuryAccount.update({
                        where: { id: destinationAccount.id },
                        data: { balance: { increment: decimalAmount } },
                    });
                    balanceAfterDest = updatedDest.balance;
                }
            }
            const transaction = await tx.financialTransaction.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.TREASURY),
                    description: dto.description,
                    amount: decimalAmount,
                    financialTransactionType: client_1.TransactionType.DEPENSE,
                    treasuryAccountId: sourceAccount.id,
                    sourceAccountId: sourceAccount.id,
                    destinationAccountId: destinationAccount?.id,
                    treasuryType: dto.treasuryType,
                    reference: dto.reference,
                    counterpartyId,
                    subsidiaryId: transactionSubsidiaryId,
                    transactionDate: new Date(dto.transactionDate),
                    status: isPending
                        ? client_1.TransactionStatus.EN_ATTENTE
                        : client_1.TransactionStatus.VALIDE,
                    balanceAfterSource,
                    balanceAfterDest,
                },
            });
            if (!isPending) {
                await this.accountingOutbox.enqueue(tx, {
                    eventType: isTransfer ? 'TREASURY_TRANSFER' : 'TREASURY_EXPENSE',
                    subsidiaryId: transactionSubsidiaryId,
                    payload: {
                        userId: user.id,
                        operationDate: new Date(dto.transactionDate).toISOString(),
                        amount: Number(decimalAmount),
                        description: dto.description,
                        sourceId: transaction.id,
                        accountType: sourceAccount.accountType,
                        destinationAccountType: destinationAccount?.accountType,
                    },
                });
            }
            return transaction;
        });
    }
    async resolveCounterparty(tx, subsidiaryId, dto) {
        if (dto.counterpartyId) {
            const existing = await tx.counterparty.findFirst({
                where: { id: dto.counterpartyId, subsidiaryId },
            });
            if (!existing) {
                throw new common_1.NotFoundException(`Counterparty with ID "${dto.counterpartyId}" not found.`);
            }
            return existing.id;
        }
        if (dto.newCounterpartyName) {
            const created = await tx.counterparty.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.COUNTERPARTY),
                    name: dto.newCounterpartyName,
                    type: dto.newCounterpartyType ?? client_1.CounterpartyType.OTHER,
                    subsidiaryId,
                },
            });
            return created.id;
        }
        return undefined;
    }
    async findEligibleCashiers(user, subsidiaryId) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user);
        const targetSubsidiaryWhere = (0, subsidiary_scope_1.withSubsidiaryScope)({}, ctx, subsidiaryId);
        const cashierRoleCondition = {
            OR: [
                { userRole: client_1.UserRole.CAISSIER },
                { roles: { has: client_1.UserRole.CAISSIER } },
                { additionalRoles: { has: client_1.UserRole.CAISSIER } },
            ],
        };
        const cashiers = await this.prisma.user.findMany({
            where: {
                ...targetSubsidiaryWhere,
                AND: [cashierRoleCondition],
            },
            select: {
                id: true,
                userName: true,
                email: true,
                subsidiary: { select: { id: true, subsidiaryName: true } },
            },
            orderBy: { userName: 'asc' },
        });
        return cashiers.map((c) => ({
            id: c.id,
            userName: c.userName,
            email: c.email,
            subsidiaryName: c.subsidiary?.subsidiaryName,
        }));
    }
    async findAllCounterparties(user, type) {
        return this.prisma.counterparty.findMany({
            where: { subsidiaryId: user.subsidiaryId, ...(type ? { type } : {}) },
            orderBy: { name: 'asc' },
        });
    }
    async findAllTransactions(user, subsidiaryId, paginationQuery = {}) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.CAISSIER], 'Permission denied to view transactions.');
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user);
        const where = (0, subsidiary_scope_1.withSubsidiaryScope)({}, ctx, subsidiaryId);
        return (0, pagination_1.paginate)(this.prisma.financialTransaction, {
            where,
            orderBy: { transactionDate: 'desc' },
            include: {
                treasuryAccount: { select: { accountName: true } },
                destinationAccount: { select: { accountName: true } },
                counterparty: { select: { name: true } },
            },
        }, paginationQuery);
    }
    async findAccountTransactions(accountId, user, paginationQuery = {}, startDate, endDate) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.CAISSIER], 'Permission denied to view transactions.');
        const account = await this.prisma.treasuryAccount.findFirst({
            where: { id: accountId },
        });
        if (!account) {
            throw new common_1.NotFoundException(`Treasury account with ID "${accountId}" not found.`);
        }
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(account.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(user));
        const where = {
            OR: [
                { treasuryAccountId: accountId },
                { destinationAccountId: accountId },
            ],
        };
        if (startDate || endDate) {
            where.transactionDate = {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
            };
        }
        return (0, pagination_1.paginate)(this.prisma.financialTransaction, {
            where,
            orderBy: { transactionDate: 'desc' },
            include: {
                treasuryAccount: { select: { accountName: true } },
                destinationAccount: { select: { accountName: true } },
                counterparty: { select: { name: true } },
            },
        }, paginationQuery);
    }
    async deleteTransaction(id, user) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'Permission denied to delete transactions.');
        const transaction = await this.prisma.financialTransaction.findFirst({
            where: { id, subsidiaryId: user.subsidiaryId },
            include: {
                treasuryAccount: true,
                needRequestPayment: { select: { id: true } },
            },
        });
        if (!transaction) {
            throw new common_1.NotFoundException(`Transaction with ID "${id}" not found.`);
        }
        if (transaction.needRequestPayment) {
            throw new common_1.BadRequestException('Le règlement lié à une expression de besoin ne peut pas être supprimé.');
        }
        return this.prisma.$transaction(async (tx) => {
            if (transaction.status === client_1.TransactionStatus.VALIDE) {
                const balanceOp = transaction.financialTransactionType === client_1.TransactionType.RECETTE
                    ? { decrement: transaction.amount }
                    : { increment: transaction.amount };
                await tx.treasuryAccount.update({
                    where: { id: transaction.treasuryAccountId },
                    data: { balance: balanceOp },
                });
            }
            return tx.financialTransaction.delete({ where: { id } });
        });
    }
    async createExpenseTransactionWithTx(tx, dto, subsidiaryId) {
        const decimalAmount = new client_1.Prisma.Decimal(dto.amount);
        const account = await tx.treasuryAccount.findFirst({
            where: { id: dto.treasuryAccountId, subsidiaryId },
        });
        if (!account) {
            throw new common_1.NotFoundException(`Treasury account with ID "${dto.treasuryAccountId}" not found.`);
        }
        if (account.balance.comparedTo(decimalAmount) < 0) {
            throw new common_1.BadRequestException(`Solde insuffisant sur "${account.accountName}". Solde: ${account.balance}, Montant: ${decimalAmount}.`);
        }
        const updatedAccount = await tx.treasuryAccount.update({
            where: { id: dto.treasuryAccountId },
            data: { balance: { decrement: decimalAmount } },
        });
        const transaction = await tx.financialTransaction.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.TREASURY),
                description: dto.description,
                relatedDocumentId: dto.relatedDocumentId,
                amount: decimalAmount,
                financialTransactionType: client_1.TransactionType.DEPENSE,
                treasuryAccountId: dto.treasuryAccountId,
                subsidiaryId,
                transactionDate: new Date(dto.transactionDate),
                providerName: dto.providerName,
                providerPhone: dto.providerPhone,
                status: client_1.TransactionStatus.VALIDE,
                balanceAfterSource: updatedAccount.balance,
            },
        });
        return { transaction, accountType: account.accountType };
    }
};
exports.TreasuryService = TreasuryService;
exports.TreasuryService = TreasuryService = TreasuryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        accounting_outbox_service_1.AccountingOutboxService])
], TreasuryService);
//# sourceMappingURL=treasury.service.js.map