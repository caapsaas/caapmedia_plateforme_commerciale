import { IsString, IsNotEmpty, IsNumber, IsEnum, IsDateString, IsOptional, IsUUID, IsPositive } from 'class-validator';
import { TransactionStatus, TransactionType, Prisma } from '@prisma/client';

export class CreateFinancialTransactionDto {
  @IsDateString()
  @IsNotEmpty()
  transactionDate: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(TransactionType)
  @IsNotEmpty()
  financialTransactionType: TransactionType;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: Prisma.Decimal;

  @IsUUID()
  @IsNotEmpty()
  treasuryAccountId: string;

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsString()
  @IsOptional()
  relatedDocumentId?: string;
}
