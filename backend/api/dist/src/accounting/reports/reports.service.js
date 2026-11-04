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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
const accounting_balance_service_1 = require("../shared/accounting-balance.service");
const accounting_scope_roles_const_1 = require("../shared/accounting-scope-roles.const");
let ReportsService = class ReportsService {
    prisma;
    balanceService;
    constructor(prisma, balanceService) {
        this.prisma = prisma;
        this.balanceService = balanceService;
    }
    async resolveFiscalYearPeriod(fiscalYearId, ctx) {
        const fiscalYear = await this.prisma.fiscalYear.findUnique({
            where: { id: fiscalYearId },
        });
        if (!fiscalYear)
            throw new common_1.NotFoundException(`Exercice fiscal "${fiscalYearId}" introuvable.`);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(fiscalYear.subsidiaryId, ctx);
        return fiscalYear;
    }
    resolveDateRange(fiscalYear, startDate, endDate) {
        const requestedStart = startDate
            ? new Date(startDate)
            : fiscalYear.startDate;
        const requestedEnd = endDate ? new Date(endDate) : fiscalYear.endDate;
        return {
            startDate: requestedStart < fiscalYear.startDate
                ? fiscalYear.startDate
                : requestedStart,
            endDate: requestedEnd > fiscalYear.endDate ? fiscalYear.endDate : requestedEnd,
        };
    }
    async getGrandLivre(user, fiscalYearId, accountNumber, journalCode, subsidiaryIdFilter, startDateFilter, endDateFilter) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user, accounting_scope_roles_const_1.ACCOUNTING_GLOBAL_SCOPE_ROLES);
        const fiscalYear = await this.resolveFiscalYearPeriod(fiscalYearId, ctx);
        const { startDate, endDate } = this.resolveDateRange(fiscalYear, startDateFilter, endDateFilter);
        const effectiveSubsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, subsidiaryIdFilter);
        const where = {
            journalEntry: {
                status: client_1.JournalEntryStatus.POSTED,
                entryDate: { gte: startDate, lte: endDate },
                ...(effectiveSubsidiaryId
                    ? { subsidiaryId: effectiveSubsidiaryId }
                    : {}),
                ...(journalCode ? { journal: { code: journalCode } } : {}),
            },
            ...(accountNumber ? { account: { accountNumber } } : {}),
        };
        const lines = await this.prisma.journalEntryLine.findMany({
            where,
            include: {
                account: {
                    select: { accountNumber: true, accountName: true, accountType: true },
                },
                journalEntry: {
                    select: {
                        entryNumber: true,
                        entryDate: true,
                        description: true,
                        journal: { select: { code: true } },
                    },
                },
            },
            orderBy: [
                { account: { accountNumber: 'asc' } },
                { journalEntry: { entryDate: 'asc' } },
            ],
            take: 20000,
        });
        const grouped = new Map();
        for (const line of lines) {
            const num = line.account.accountNumber;
            if (!grouped.has(num)) {
                grouped.set(num, {
                    account: line.account,
                    movements: [],
                    totalDebit: 0,
                    totalCredit: 0,
                    balance: 0,
                });
            }
            const entry = grouped.get(num);
            const debit = Number(line.debitAmount);
            const credit = Number(line.creditAmount);
            entry.totalDebit += debit;
            entry.totalCredit += credit;
            entry.balance += debit - credit;
            entry.movements.push({
                date: line.journalEntry.entryDate,
                entryNumber: line.journalEntry.entryNumber,
                journalCode: line.journalEntry.journal?.code,
                description: line.journalEntry.description,
                debit,
                credit,
                runningBalance: entry.balance,
            });
        }
        return Array.from(grouped.values());
    }
    async getBalanceGenerale(user, fiscalYearId, subsidiaryIdFilter, startDateFilter, endDateFilter) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user, accounting_scope_roles_const_1.ACCOUNTING_GLOBAL_SCOPE_ROLES);
        const fiscalYear = await this.resolveFiscalYearPeriod(fiscalYearId, ctx);
        const { startDate, endDate } = this.resolveDateRange(fiscalYear, startDateFilter, endDateFilter);
        const effectiveSubsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, subsidiaryIdFilter);
        const lines = await this.prisma.journalEntryLine.findMany({
            where: {
                journalEntry: {
                    status: client_1.JournalEntryStatus.POSTED,
                    entryDate: { gte: startDate, lte: endDate },
                    ...(effectiveSubsidiaryId
                        ? { subsidiaryId: effectiveSubsidiaryId }
                        : {}),
                },
            },
            include: {
                account: {
                    select: { accountNumber: true, accountName: true, accountType: true },
                },
            },
            take: 20000,
        });
        const map = new Map();
        for (const line of lines) {
            const num = line.account.accountNumber;
            if (!map.has(num)) {
                map.set(num, {
                    accountNumber: num,
                    accountName: line.account.accountName,
                    accountType: line.account.accountType,
                    mouvDebit: 0,
                    mouvCredit: 0,
                });
            }
            const row = map.get(num);
            row.mouvDebit += Number(line.debitAmount);
            row.mouvCredit += Number(line.creditAmount);
        }
        const balance = Array.from(map.values())
            .sort((a, b) => a.accountNumber.localeCompare(b.accountNumber))
            .map((row) => {
            const net = row.mouvDebit - row.mouvCredit;
            return {
                ...row,
                soldeDebiteur: net > 0 ? net : 0,
                soldeCrediteur: net < 0 ? Math.abs(net) : 0,
            };
        });
        const totaux = balance.reduce((t, r) => ({
            totalMouvDebit: t.totalMouvDebit + r.mouvDebit,
            totalMouvCredit: t.totalMouvCredit + r.mouvCredit,
            totalSoldeDebiteur: t.totalSoldeDebiteur + r.soldeDebiteur,
            totalSoldeCrediteur: t.totalSoldeCrediteur + r.soldeCrediteur,
        }), {
            totalMouvDebit: 0,
            totalMouvCredit: 0,
            totalSoldeDebiteur: 0,
            totalSoldeCrediteur: 0,
        });
        return { balance, totaux };
    }
    async getJournalCentralisateur(user, fiscalYearId, journalCode, subsidiaryIdFilter, startDateFilter, endDateFilter) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user, accounting_scope_roles_const_1.ACCOUNTING_GLOBAL_SCOPE_ROLES);
        const fiscalYear = await this.resolveFiscalYearPeriod(fiscalYearId, ctx);
        const { startDate, endDate } = this.resolveDateRange(fiscalYear, startDateFilter, endDateFilter);
        const effectiveSubsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, subsidiaryIdFilter);
        const entries = await this.prisma.journalEntry.findMany({
            where: {
                status: client_1.JournalEntryStatus.POSTED,
                entryDate: { gte: startDate, lte: endDate },
                ...(effectiveSubsidiaryId
                    ? { subsidiaryId: effectiveSubsidiaryId }
                    : {}),
                ...(journalCode ? { journal: { code: journalCode } } : {}),
            },
            include: {
                journal: { select: { code: true, name: true } },
                lines: {
                    include: {
                        account: { select: { accountNumber: true, accountName: true } },
                    },
                },
            },
            orderBy: [{ journal: { code: 'asc' } }, { entryDate: 'asc' }],
            take: 20000,
        });
        const grouped = new Map();
        for (const entry of entries) {
            const code = entry.journal?.code ?? 'JOD';
            if (!grouped.has(code)) {
                grouped.set(code, {
                    journal: entry.journal,
                    entries: [],
                    totalDebit: 0,
                    totalCredit: 0,
                });
            }
            const g = grouped.get(code);
            const totDebit = entry.lines.reduce((s, l) => s + Number(l.debitAmount), 0);
            const totCredit = entry.lines.reduce((s, l) => s + Number(l.creditAmount), 0);
            g.totalDebit += totDebit;
            g.totalCredit += totCredit;
            g.entries.push({
                entryNumber: entry.entryNumber,
                date: entry.entryDate,
                description: entry.description,
                totalDebit: totDebit,
                totalCredit: totCredit,
                lines: entry.lines.map((l) => ({
                    accountNumber: l.account.accountNumber,
                    accountName: l.account.accountName,
                    debit: Number(l.debitAmount),
                    credit: Number(l.creditAmount),
                })),
            });
        }
        return Array.from(grouped.values());
    }
    async getSyscohadaStatements(user, fiscalYearId, subsidiaryIdFilter) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user, accounting_scope_roles_const_1.ACCOUNTING_GLOBAL_SCOPE_ROLES);
        const fiscalYear = await this.resolveFiscalYearPeriod(fiscalYearId, ctx);
        const effectiveSubsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, subsidiaryIdFilter);
        const { startDate, endDate } = fiscalYear;
        const bal = (prefix) => this.balanceService.getAccountBalanceByPrefix(prefix, startDate, endDate, effectiveSubsidiaryId);
        const [immobilisationsBrutes, amortissements, stocks, creancesClients, tvaDeductible, tresorerie, capitalSocial, reserves, dettesLongTerme, dettesFournisseurs, tvaCollectee, autresDettes,] = await Promise.all([
            bal(['21', '22']),
            bal('28'),
            bal(['31', '32']),
            bal('411'),
            bal(['4451', '4452']),
            bal(['521', '571']),
            bal('101'),
            bal('111'),
            bal('162'),
            bal('401'),
            bal('4431'),
            bal(['421', '431', '447']),
        ]);
        const bilan = {
            actif: {
                immobilisationsNettes: immobilisationsBrutes - Math.abs(amortissements),
                stocks,
                creancesClients,
                tvaDeductible,
                tresorerie,
            },
            passif: {
                capitalSocial: Math.abs(capitalSocial),
                reserves: Math.abs(reserves),
                resultatExercice: 0,
                dettesLongTerme: Math.abs(dettesLongTerme),
                dettesFournisseurs: Math.abs(dettesFournisseurs),
                tvaCollectee: Math.abs(tvaCollectee),
                autresDettes: Math.abs(autresDettes),
            },
        };
        bilan.actif['totalActif'] = Object.values(bilan.actif).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
        const [ventesMarchandises, prestationsServices, autresProduits, achatsMarchandises, chargesExternes, chargesPersonnel, dotationsAmort, chargesFinancieres, autresCharges, is,] = await Promise.all([
            bal('701'),
            bal('706'),
            bal(['707', '74', '75', '77', '78']),
            bal(['601', '602']),
            bal(['61', '62']),
            bal(['641', '644', '645', '646']),
            bal('681'),
            bal('661'),
            bal(['63', '65', '67', '68']),
            bal('691'),
        ]);
        const comptResultat = {
            produits: {
                ventesMarchandises: Math.abs(ventesMarchandises),
                prestationsServices: Math.abs(prestationsServices),
                autresProduits: Math.abs(autresProduits),
            },
            charges: {
                achatsMarchandises,
                chargesExternes,
                chargesPersonnel,
                dotationsAmort,
                chargesFinancieres,
                autresCharges,
                is,
            },
        };
        const totalProduits = Object.values(comptResultat.produits).reduce((s, v) => s + v, 0);
        const totalCharges = Object.values(comptResultat.charges).reduce((s, v) => s + v, 0);
        const resultatNet = totalProduits - totalCharges;
        bilan.passif.resultatExercice = resultatNet;
        bilan.passif['totalPassif'] = Object.values(bilan.passif).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
        return {
            bilan,
            comptResultat: {
                ...comptResultat,
                totalProduits,
                totalCharges,
                resultatNet,
                margeCommerciale: comptResultat.produits.ventesMarchandises -
                    comptResultat.charges.achatsMarchandises,
                ebe: totalProduits -
                    comptResultat.charges.achatsMarchandises -
                    comptResultat.charges.chargesExternes -
                    comptResultat.charges.chargesPersonnel,
            },
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        accounting_balance_service_1.AccountingBalanceService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map