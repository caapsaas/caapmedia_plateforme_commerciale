import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class PayExpenseDto {
  @IsString()
  @IsNotEmpty()
  safeId: string;

  @IsNumber()
  @IsPositive()
  expectedAmount: number;

  @IsDateString({ strict: true })
  transactionDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;
}
