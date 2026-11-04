import { ExpenseCategory, ExpenseType, RecurringExpenseFrequency } from '@prisma/client';
export declare class CreateRecurringExpenseDto {
    description: string;
    amount: number;
    category: ExpenseCategory;
    expenseRecordType: ExpenseType;
    frequency: RecurringExpenseFrequency;
    startDate: string;
    endDate?: string;
}
