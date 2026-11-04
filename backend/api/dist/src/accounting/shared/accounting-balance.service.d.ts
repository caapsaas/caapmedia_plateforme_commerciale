import { PrismaService } from "../../common/utils/prisma/prisma.service";
export type BalanceSide = 'DEBIT' | 'CREDIT';
export declare class AccountingBalanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAccountBalance(accountNumbers: string[], startDate: Date | null, endDate: Date, side: BalanceSide, subsidiaryId?: string): Promise<number>;
    getAccountBalanceByPrefix(prefixes: string | string[], startDate: Date | null, endDate: Date, subsidiaryId?: string): Promise<number>;
}
