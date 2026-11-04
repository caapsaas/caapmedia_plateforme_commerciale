import { ExpenseCategory } from '@prisma/client';
export declare class PayNeedRequestDto {
    amount: number;
    transactionDate: string;
    beneficiary: string;
    category: ExpenseCategory;
    reference?: string;
}
