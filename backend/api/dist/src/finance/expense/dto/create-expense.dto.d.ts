import { ExpenseCategory, ExpenseType } from '@prisma/client';
export declare class CreateExpenseDto {
    description: string;
    amount: number;
    category: ExpenseCategory;
    expenseRecordType: ExpenseType;
    expenseDate: string;
}
