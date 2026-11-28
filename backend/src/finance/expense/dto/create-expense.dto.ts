import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ExpenseCategory, ExpenseType } from '@prisma/client';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsEnum(ExpenseCategory)
  @IsNotEmpty()
  category: ExpenseCategory;

  @IsEnum(ExpenseType)
  @IsNotEmpty()
  expenseRecordType: ExpenseType;

  @IsDateString()
  @IsNotEmpty()
  expenseDate: string;

  @IsOptional()
  @IsBoolean()
  isPendingInvoice?: boolean;

  @IsOptional()
  @IsString()
  proofFilePath?: string;
}
