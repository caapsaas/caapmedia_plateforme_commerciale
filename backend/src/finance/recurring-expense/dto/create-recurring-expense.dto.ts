import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import {
  ExpenseCategory,
  ExpenseType,
  RecurringExpenseFrequency,
} from '@prisma/client';

export class CreateRecurringExpenseDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(ExpenseCategory)
  @IsNotEmpty()
  category: ExpenseCategory;

  @IsEnum(ExpenseType)
  @IsNotEmpty()
  expenseRecordType: ExpenseType;

  @IsEnum(RecurringExpenseFrequency)
  @IsNotEmpty()
  frequency: RecurringExpenseFrequency;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
