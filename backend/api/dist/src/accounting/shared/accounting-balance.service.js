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
exports.AccountingBalanceService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
let AccountingBalanceService = class AccountingBalanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAccountBalance(accountNumbers, startDate, endDate, side, subsidiaryId) {
        if (accountNumbers.length === 0)
            return 0;
        const lines = await this.prisma.journalEntryLine.findMany({
            where: {
                account: { accountNumber: { in: accountNumbers } },
                journalEntry: {
                    status: client_1.JournalEntryStatus.POSTED,
                    entryDate: {
                        ...(startDate ? { gte: startDate } : {}),
                        lte: endDate,
                    },
                    ...(subsidiaryId ? { subsidiaryId } : {}),
                },
            },
            select: { debitAmount: true, creditAmount: true },
        });
        const totalDebit = lines.reduce((s, l) => s + Number(l.debitAmount), 0);
        const totalCredit = lines.reduce((s, l) => s + Number(l.creditAmount), 0);
        return side === 'DEBIT'
            ? totalDebit - totalCredit
            : totalCredit - totalDebit;
    }
    async getAccountBalanceByPrefix(prefixes, startDate, endDate, subsidiaryId) {
        const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes];
        const accounts = await this.prisma.accountingAccount.findMany({
            where: {
                OR: prefixList.map((p) => ({ accountNumber: { startsWith: p } })),
            },
            select: { accountNumber: true, class: true },
        });
        if (accounts.length === 0)
            return 0;
        const side = accounts[0].class === 7 ? 'CREDIT' : 'DEBIT';
        return this.getAccountBalance(accounts.map((a) => a.accountNumber), startDate, endDate, side, subsidiaryId);
    }
};
exports.AccountingBalanceService = AccountingBalanceService;
exports.AccountingBalanceService = AccountingBalanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountingBalanceService);
//# sourceMappingURL=accounting-balance.service.js.map