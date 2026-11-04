import { CreateRecurringExpenseDto } from './create-recurring-expense.dto';
declare const UpdateRecurringExpenseDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateRecurringExpenseDto>>;
export declare class UpdateRecurringExpenseDto extends UpdateRecurringExpenseDto_base {
    isActive?: boolean;
}
export {};
