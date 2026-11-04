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
exports.EntriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
const accounting_scope_roles_const_1 = require("../shared/accounting-scope-roles.const");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
const BALANCE_TOLERANCE = 0.01;
let EntriesService = class EntriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(user, fiscalYearId, status, startDate, endDate, subsidiaryIdFilter, paginationQuery = {}) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user, accounting_scope_roles_const_1.ACCOUNTING_GLOBAL_SCOPE_ROLES);
        const where = (0, subsidiary_scope_1.withSubsidiaryScope)({
            ...(fiscalYearId ? { fiscalYearId } : {}),
            ...(status ? { status } : {}),
            ...(startDate || endDate
                ? {
                    entryDate: {
                        ...(startDate ? { gte: new Date(startDate) } : {}),
                        ...(endDate ? { lte: new Date(endDate) } : {}),
                    },
                }
                : {}),
            ...(paginationQuery.search
                ? {
                    description: {
                        contains: paginationQuery.search,
                        mode: 'insensitive',
                    },
                }
                : {}),
        }, ctx, subsidiaryIdFilter);
        return (0, pagination_1.paginate)(this.prisma.journalEntry, {
            where,
            orderBy: { entryDate: 'desc' },
            include: {
                journal: { select: { code: true, name: true } },
                lines: {
                    include: {
                        account: { select: { accountNumber: true, accountName: true } },
                    },
                },
            },
        }, paginationQuery);
    }
    async findOne(id, user) {
        const entry = await this.prisma.journalEntry.findFirst({
            where: { id, subsidiaryId: user.subsidiaryId },
            include: {
                journal: { select: { code: true, name: true } },
                lines: {
                    include: {
                        account: { select: { accountNumber: true, accountName: true } },
                    },
                },
                fiscalYear: { select: { name: true } },
                reversalOfEntry: { select: { id: true, entryNumber: true } },
                reversedByEntries: { select: { id: true, entryNumber: true } },
            },
        });
        if (!entry)
            throw new common_1.NotFoundException(`Écriture comptable "${id}" introuvable.`);
        return entry;
    }
    async create(dto, user) {
        this.validateBalance(dto.lines);
        const journal = await this.prisma.accountingJournal.findUnique({
            where: { id: dto.journalId },
        });
        if (!journal)
            throw new common_1.NotFoundException('Journal introuvable.');
        const entryDate = new Date(dto.entryDate);
        const fiscalYearId = await this.resolveFiscalYearId(user.subsidiaryId, entryDate, dto.fiscalYearId);
        return this.prisma.journalEntry.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.JOURNALENTRY),
                entryNumber: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.JOURNALENTRY),
                entryDate,
                description: dto.description,
                status: client_1.JournalEntryStatus.DRAFT,
                journalId: dto.journalId,
                ...(fiscalYearId ? { fiscalYearId } : {}),
                subsidiaryId: user.subsidiaryId,
                createdBy: user.id,
                lines: {
                    create: dto.lines.map((line) => ({
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.JOURNALENTRYLINE),
                        accountId: line.accountId,
                        description: line.description,
                        debitAmount: new client_1.Prisma.Decimal(line.debitAmount),
                        creditAmount: new client_1.Prisma.Decimal(line.creditAmount),
                    })),
                },
            },
            include: { lines: { include: { account: true } } },
        });
    }
    async post(id, user) {
        const entry = await this.findOne(id, user);
        if (entry.status === client_1.JournalEntryStatus.POSTED) {
            throw new common_1.BadRequestException('Cette écriture est déjà validée.');
        }
        if (entry.status === client_1.JournalEntryStatus.CANCELLED) {
            throw new common_1.BadRequestException('Impossible de valider une écriture annulée.');
        }
        this.validateBalance(entry.lines);
        return this.prisma.$transaction(async (tx) => {
            const sequentialNumber = await this.assignSequentialNumber(tx, entry.journalId, entry.subsidiaryId, entry.entryDate);
            return tx.journalEntry.update({
                where: { id },
                data: { status: client_1.JournalEntryStatus.POSTED, sequentialNumber },
            });
        });
    }
    async cancel(id, user) {
        const entry = await this.findOne(id, user);
        if (entry.status === client_1.JournalEntryStatus.POSTED) {
            throw new common_1.BadRequestException("Cette écriture est déjà validée : utilisez l'extourne (reverse) plutôt que l'annulation.");
        }
        if (entry.status === client_1.JournalEntryStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cette écriture est déjà annulée.');
        }
        return this.prisma.journalEntry.update({
            where: { id },
            data: { status: client_1.JournalEntryStatus.CANCELLED },
        });
    }
    async reverse(id, user) {
        const original = await this.findOne(id, user);
        if (original.status !== client_1.JournalEntryStatus.POSTED) {
            throw new common_1.BadRequestException('Seule une écriture validée peut être extournée.');
        }
        const alreadyReversed = await this.prisma.journalEntry.findFirst({
            where: { reversalOfEntryId: id },
        });
        if (alreadyReversed) {
            throw new common_1.BadRequestException(`Cette écriture a déjà été extournée (voir ${alreadyReversed.sequentialNumber || alreadyReversed.entryNumber}).`);
        }
        const reversalDate = new Date();
        const invertedLines = original.lines.map((line) => ({
            accountId: line.accountId,
            description: line.description
                ? `Extourne — ${line.description}`
                : 'Extourne',
            debitAmount: Number(line.creditAmount),
            creditAmount: Number(line.debitAmount),
        }));
        return this.prisma.$transaction(async (tx) => {
            const sequentialNumber = await this.assignSequentialNumber(tx, original.journalId, original.subsidiaryId, reversalDate);
            return tx.journalEntry.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.JOURNALENTRY),
                    entryNumber: `EXT-${original.entryNumber}`,
                    entryDate: reversalDate,
                    description: `Extourne de "${original.description}" (${original.sequentialNumber || original.entryNumber})`,
                    status: client_1.JournalEntryStatus.POSTED,
                    journalId: original.journalId,
                    fiscalYearId: original.fiscalYearId,
                    subsidiaryId: original.subsidiaryId,
                    createdBy: user.id,
                    reversalOfEntryId: id,
                    sequentialNumber,
                    lines: {
                        create: invertedLines.map((line) => ({
                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.JOURNALENTRYLINE),
                            accountId: line.accountId,
                            description: line.description,
                            debitAmount: new client_1.Prisma.Decimal(line.debitAmount),
                            creditAmount: new client_1.Prisma.Decimal(line.creditAmount),
                        })),
                    },
                },
                include: { lines: true },
            });
        });
    }
    async createAutomaticEntry(dto) {
        const journal = await this.prisma.accountingJournal.findUnique({
            where: { code: dto.journalCode },
        });
        if (!journal)
            throw new common_1.NotFoundException(`Journal "${dto.journalCode}" introuvable.`);
        const existing = await this.prisma.journalEntry.findFirst({
            where: {
                entryNumber: dto.reference,
                journalId: journal.id,
                subsidiaryId: dto.subsidiaryId,
            },
        });
        if (existing)
            return existing;
        const accountNumbers = [...new Set(dto.lines.map((l) => l.accountNumber))];
        const accounts = await this.prisma.accountingAccount.findMany({
            where: { accountNumber: { in: accountNumbers } },
        });
        const accountByNumber = new Map(accounts.map((a) => [a.accountNumber, a]));
        const lines = dto.lines.map((line) => {
            const account = accountByNumber.get(line.accountNumber);
            if (!account)
                throw new common_1.BadRequestException(`Compte "${line.accountNumber}" introuvable dans le plan comptable.`);
            if (!account.isActive)
                throw new common_1.BadRequestException(`Le compte "${line.accountNumber}" est désactivé.`);
            return {
                accountId: account.id,
                description: line.description ?? dto.description,
                debitAmount: line.debitAmount,
                creditAmount: line.creditAmount,
            };
        });
        this.validateBalance(lines);
        const fiscalYearId = await this.resolveFiscalYearId(dto.subsidiaryId, dto.date);
        return this.prisma.$transaction(async (tx) => {
            const sequentialNumber = await this.assignSequentialNumber(tx, journal.id, dto.subsidiaryId, dto.date);
            return tx.journalEntry.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.JOURNALENTRY),
                    entryNumber: dto.reference,
                    entryDate: dto.date,
                    description: dto.description,
                    status: client_1.JournalEntryStatus.POSTED,
                    journalId: journal.id,
                    ...(fiscalYearId ? { fiscalYearId } : {}),
                    subsidiaryId: dto.subsidiaryId,
                    sourceType: dto.sourceType,
                    sourceId: dto.sourceId,
                    sequentialNumber,
                    lines: {
                        create: lines.map((line) => ({
                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.JOURNALENTRYLINE),
                            accountId: line.accountId,
                            description: line.description,
                            debitAmount: new client_1.Prisma.Decimal(line.debitAmount),
                            creditAmount: new client_1.Prisma.Decimal(line.creditAmount),
                        })),
                    },
                },
                include: { lines: true },
            });
        });
    }
    validateBalance(lines) {
        const totalDebit = lines.reduce((s, l) => s + Number(l.debitAmount), 0);
        const totalCredit = lines.reduce((s, l) => s + Number(l.creditAmount), 0);
        if (Math.abs(totalDebit - totalCredit) > BALANCE_TOLERANCE) {
            throw new common_1.BadRequestException(`L'écriture n'est pas équilibrée (Débit: ${totalDebit}, Crédit: ${totalCredit}).`);
        }
    }
    async resolveFiscalYearId(subsidiaryId, date, explicitFiscalYearId) {
        if (explicitFiscalYearId) {
            const fy = await this.prisma.fiscalYear.findFirst({
                where: { id: explicitFiscalYearId, subsidiaryId },
            });
            if (!fy)
                throw new common_1.NotFoundException('Exercice fiscal introuvable.');
            if (fy.isClosed)
                throw new common_1.BadRequestException('Cet exercice fiscal est clôturé.');
            return fy.id;
        }
        const period = await this.prisma.fiscalYear.findFirst({
            where: { subsidiaryId, startDate: { lte: date }, endDate: { gte: date } },
        });
        if (!period)
            return undefined;
        if (period.isClosed) {
            throw new common_1.BadRequestException(`Impossible de créer une écriture : l'exercice du ${period.startDate.toLocaleDateString('fr-FR')} au ${period.endDate.toLocaleDateString('fr-FR')} est clôturé.`);
        }
        return period.id;
    }
    async assignSequentialNumber(tx, journalId, subsidiaryId, date) {
        const journal = await tx.accountingJournal.findUniqueOrThrow({
            where: { id: journalId },
        });
        const year = date.getFullYear();
        const sequence = await tx.accountingJournalSequence.upsert({
            where: { journalId_subsidiaryId_year: { journalId, subsidiaryId, year } },
            create: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ACCOUNTINGJOURNALSEQUENCE),
                journalId,
                subsidiaryId,
                year,
                lastNumber: 1,
            },
            update: { lastNumber: { increment: 1 } },
        });
        return `${journal.code}-${year}-${String(sequence.lastNumber).padStart(6, '0')}`;
    }
};
exports.EntriesService = EntriesService;
exports.EntriesService = EntriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EntriesService);
//# sourceMappingURL=entries.service.js.map