import { AccountType, ExpenseCategory } from '@prisma/client';
import { EntriesService } from '../entries/entries.service';
import { PeriodsService } from '../periods/periods.service';
import { MappingsService } from '../accounts/mappings.service';
import { PrismaService } from "../../common/utils/prisma/prisma.service";
export type OperationSource = 'TREASURY_INCOME' | 'TREASURY_EXPENSE' | 'TREASURY_TRANSFER' | 'SALE_PAID' | 'EXPENSE_RECORD' | 'SUPPLIER_DEBT_PAYMENT' | 'LONG_TERM_DEBT_RECEIPT' | 'FIXED_ASSET_ACQUISITION' | 'PAYROLL_ACCRUAL' | 'PAYROLL_CHARGE_PAYMENT' | 'BONUS_PAYMENT';
export interface JournalizationContext {
    subsidiaryId: string;
    userId: string;
    operationDate: Date;
    amount: number;
    description: string;
    sourceType: OperationSource;
    sourceId: string;
    accountType?: AccountType;
    destinationAccountType?: AccountType;
    expenseCategory?: ExpenseCategory;
    withTva?: boolean;
}
export declare class JournalizationService {
    private readonly entriesService;
    private readonly periodsService;
    private readonly mappingsService;
    private readonly prisma;
    constructor(entriesService: EntriesService, periodsService: PeriodsService, mappingsService: MappingsService, prisma: PrismaService);
    journalize(ctx: JournalizationContext): Promise<void>;
    private requiresTvaRate;
    private getDefaultTvaRate;
    private buildLines;
}
