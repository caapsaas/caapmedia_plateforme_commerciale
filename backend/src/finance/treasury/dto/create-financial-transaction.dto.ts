import { IsString, IsNotEmpty, IsNumber, IsEnum, IsDateString, IsOptional, IsUUID, IsPositive, MaxLength } from 'class-validator';
import { TransactionType, Prisma } from '@prisma/client';

export class CreateFinancialTransactionDto {
  @IsDateString()
  @IsNotEmpty()
  transactionDate: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(TransactionType)
  @IsOptional()
  financialTransactionType?: TransactionType;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @IsUUID()
  @IsNotEmpty()
  treasuryAccountId: string;

  @IsString()
  @IsOptional()
  relatedDocumentId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  providerName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  providerPhone?: string;
}
