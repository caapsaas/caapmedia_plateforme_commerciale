import { AccountType, ExpenseCategory, Prisma } from '@prisma/client';
export type OutboxEventType = 'PAYROLL_ENTRY' | 'BONUS_ENTRY' | 'CHARGE_PAYMENT_ENTRY' | 'TREASURY_INCOME' | 'TREASURY_EXPENSE' | 'TREASURY_TRANSFER' | 'SALE_PAID' | 'EXPENSE_RECORD' | 'SUPPLIER_DEBT_PAYMENT' | 'LONG_TERM_DEBT_RECEIPT' | 'FIXED_ASSET_ACQUISITION' | 'PAYROLL_CHARGE_PAYMENT';
export interface AccountingOutboxPayload {
    userId: string;
    operationDate: string;
    amount: number;
    description: string;
    sourceId: string;
    accountType?: AccountType;
    destinationAccountType?: AccountType;
    expenseCategory?: ExpenseCategory;
    withTva?: boolean;
}
export interface EnqueueAccountingEventDto {
    eventType: OutboxEventType;
    payload: AccountingOutboxPayload;
    subsidiaryId: string;
}
export declare class AccountingOutboxService {
    enqueue(tx: Prisma.TransactionClient, dto: EnqueueAccountingEventDto): Promise<void>;
}
