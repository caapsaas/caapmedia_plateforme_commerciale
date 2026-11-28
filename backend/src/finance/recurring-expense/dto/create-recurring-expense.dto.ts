import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  IsBoolean,
  Min,
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
  @Min(0)
  amount: number;

  @IsOptional()
  @IsBoolean()
  isVariableAmount?: boolean;

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
