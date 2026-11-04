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
exports.JournalizationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const entries_service_1 = require("../entries/entries.service");
const periods_service_1 = require("../periods/periods.service");
const mappings_service_1 = require("../accounts/mappings.service");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const CASH_FAMILY_ACCOUNT_TYPES = [
    client_1.AccountType.CASH_REGISTER,
    client_1.AccountType.SAFE,
    client_1.AccountType.EXPENSE_BOX,
];
const EXPENSE_CATEGORY_ACCOUNT = {
    RENT: '613000',
    SALARIES: '641000',
    ADVERTISING: '627000',
    TRANSPORT: '624000',
    SERVICES: '628000',
    INSURANCE: '631000',
    PURCHASE_COST: '601000',
    COMMISSIONS: '628000',
    PACKAGING: '604000',
    TRANSACTION_FEES: '628000',
    OTHER: '659000',
};
let JournalizationService = class JournalizationService {
    entriesService;
    periodsService;
    mappingsService;
    prisma;
    constructor(entriesService, periodsService, mappingsService, prisma) {
        this.entriesService = entriesService;
        this.periodsService = periodsService;
        this.mappingsService = mappingsService;
        this.prisma = prisma;
    }
    async journalize(ctx) {
        const { subsidiaryId, operationDate, description, sourceType, sourceId } = ctx;
        await this.periodsService.getOrCreateCurrentFiscalYear(subsidiaryId);
        const mappings = await this.mappingsService.getMap();
        const tvaRate = this.requiresTvaRate(ctx)
            ? await this.getDefaultTvaRate()
            : 0;
        const { journalCode, lines } = this.buildLines(ctx, mappings, tvaRate);
        if (!lines || lines.length === 0)
            return;
        await this.entriesService.createAutomaticEntry({
            date: operationDate,
            reference: `${sourceType}-${sourceId}`,
            description,
            journalCode,
            subsidiaryId,
            sourceType,
            sourceId,
            lines,
        });
    }
    requiresTvaRate(ctx) {
        return (ctx.sourceType === 'SALE_PAID' ||
            ctx.sourceType === 'EXPENSE_RECORD' ||
            (ctx.sourceType === 'TREASURY_EXPENSE' && !!ctx.withTva));
    }
    async getDefaultTvaRate() {
        const taxRate = await this.prisma.taxRate.findFirstOrThrow({
            where: { isDefault: true },
        });
        return Number(taxRate.rate);
    }
    buildLines(ctx, mappings, tvaRate) {
        const { amount, sourceType, accountType, destinationAccountType, expenseCategory, withTva, } = ctx;
        const isCashFamily = !!accountType && CASH_FAMILY_ACCOUNT_TYPES.includes(accountType);
        const treasuryAccount = isCashFamily
            ? mappings['CASH_ACCOUNT'] || '571000'
            : mappings['BANK_ACCOUNT'] || '521000';
        switch (sourceType) {
            case 'TREASURY_TRANSFER': {
                const isDestCashFamily = !!destinationAccountType &&
                    CASH_FAMILY_ACCOUNT_TYPES.includes(destinationAccountType);
                const destinationAccount = isDestCashFamily
                    ? mappings['CASH_ACCOUNT'] || '571000'
                    : mappings['BANK_ACCOUNT'] || '521000';
                return {
                    journalCode: 'JOD',
                    lines: [
                        {
                            accountNumber: destinationAccount,
                            description: 'Virement interne — destination',
                            debitAmount: amount,
                            creditAmount: 0,
                        },
                        {
                            accountNumber: treasuryAccount,
                            description: 'Virement interne — source',
                            debitAmount: 0,
                            creditAmount: amount,
                        },
                    ],
                };
            }
            case 'TREASURY_INCOME': {
                return {
                    journalCode: isCashFamily ? 'JC' : 'JB',
                    lines: [
                        {
                            accountNumber: treasuryAccount,
                            description: 'Encaissement',
                            debitAmount: amount,
                            creditAmount: 0,
                        },
                        {
                            accountNumber: mappings['SALES_CLIENT'] || '411000',
                            description: 'Client',
                            debitAmount: 0,
                            creditAmount: amount,
                        },
                    ],
                };
            }
            case 'TREASURY_EXPENSE': {
                const chargeNum = EXPENSE_CATEGORY_ACCOUNT[expenseCategory ?? 'OTHER'] ?? '659000';
                const amountHT = withTva ? amount / (1 + tvaRate) : amount;
                const tvaAmount = withTva ? amount - amountHT : 0;
                const lines = [
                    {
                        accountNumber: chargeNum,
                        description: 'Charge',
                        debitAmount: amountHT,
                        creditAmount: 0,
                    },
                    {
                        accountNumber: treasuryAccount,
                        description: 'Règlement',
                        debitAmount: 0,
                        creditAmount: amount,
                    },
                ];
                if (withTva) {
                    lines.splice(1, 0, {
                        accountNumber: mappings['TVA_DEDUCTIBLE_ACHAT'] || '445100',
                        description: `TVA déductible ${(tvaRate * 100).toFixed(2)}%`,
                        debitAmount: tvaAmount,
                        creditAmount: 0,
                    });
                }
                return {
                    journalCode: isCashFamily ? 'JC' : 'JB',
                    lines,
                };
            }
            case 'SALE_PAID': {
                const amountHT = amount / (1 + tvaRate);
                const tvaAmount = amount - amountHT;
                return {
                    journalCode: 'JV',
                    lines: [
                        {
                            accountNumber: mappings['SALES_CLIENT'] || '411000',
                            description: 'Vente client',
                            debitAmount: amount,
                            creditAmount: 0,
                        },
                        {
                            accountNumber: mappings['SALES_REVENUE'] || '706000',
                            description: 'Produit HT',
                            debitAmount: 0,
                            creditAmount: amountHT,
                        },
                        {
                            accountNumber: mappings['TVA_COLLECTEE'] || '443100',
                            description: `TVA collectée ${(tvaRate * 100).toFixed(2)}%`,
                            debitAmount: 0,
                            creditAmount: tvaAmount,
                        },
                    ],
                };
            }
            case 'EXPENSE_RECORD': {
                const chargeNum = EXPENSE_CATEGORY_ACCOUNT[expenseCategory ?? 'OTHER'] ?? '659000';
                const amountHT = amount / (1 + tvaRate);
                const tvaAmount = amount - amountHT;
                return {
                    journalCode: 'JOD',
                    lines: [
                        {
                            accountNumber: chargeNum,
                            description: 'Charge enregistrée',
                            debitAmount: amountHT,
                            creditAmount: 0,
                        },
                        {
                            accountNumber: mappings['TVA_DEDUCTIBLE_ACHAT'] || '445200',
                            description: `TVA déductible ${(tvaRate * 100).toFixed(2)}%`,
                            debitAmount: tvaAmount,
                            creditAmount: 0,
                        },
                        {
                            accountNumber: mappings['PURCHASE_SUPPLIER'] || '401000',
                            description: 'Fournisseur ou caisse',
                            debitAmount: 0,
                            creditAmount: amount,
                        },
                    ],
                };
            }
            case 'SUPPLIER_DEBT_PAYMENT': {
                return {
                    journalCode: 'JA',
                    lines: [
                        {
                            accountNumber: mappings['PURCHASE_SUPPLIER'] || '401000',
                            description: 'Apurement dette fournisseur',
                            debitAmount: amount,
                            creditAmount: 0,
                        },
                        {
                            accountNumber: treasuryAccount,
                            description: 'Règlement',
                            debitAmount: 0,
                            creditAmount: amount,
                        },
                    ],
                };
            }
            case 'LONG_TERM_DEBT_RECEIPT': {
                return {
                    journalCode: 'JB',
                    lines: [
                        {
                            accountNumber: mappings['BANK_ACCOUNT'] || '521000',
                            description: 'Réception emprunt',
                            debitAmount: amount,
                            creditAmount: 0,
                        },
                        {
                            accountNumber: mappings['LONG_TERM_DEBT'] || '162000',
                            description: 'Emprunt LT',
                            debitAmount: 0,
                            creditAmount: amount,
                        },
                    ],
                };
            }
            case 'FIXED_ASSET_ACQUISITION': {
                return {
                    journalCode: 'JOD',
                    lines: [
                        {
                            accountNumber: mappings['FIXED_ASSET'] || '215000',
                            description: 'Acquisition immobilisation',
                            debitAmount: amount,
                            creditAmount: 0,
                        },
                        {
                            accountNumber: mappings['BANK_ACCOUNT'] || '521000',
                            description: 'Règlement',
                            debitAmount: 0,
                            creditAmount: amount,
                        },
                    ],
                };
            }
            default:
                return { journalCode: 'JOD', lines: [] };
        }
    }
};
exports.JournalizationService = JournalizationService;
exports.JournalizationService = JournalizationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [entries_service_1.EntriesService,
        periods_service_1.PeriodsService,
        mappings_service_1.MappingsService,
        prisma_service_1.PrismaService])
], JournalizationService);
//# sourceMappingURL=journalization.service.js.map