import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber, IsDateString } from 'class-validator';
import { ExternalTransactionStatus, ExternalTransactionType, ExternalTransactionCategory, PaymentMethod } from '@prisma/client';

export class UpdateExternalTransactionDto {
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsEnum(ExternalTransactionType)
  externalTransactionType?: ExternalTransactionType;

  @IsOptional()
  @IsEnum(ExternalTransactionCategory)
  externalTransactionCategory?: ExternalTransactionCategory;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  relatedDocumentUrl?: string;

  @IsOptional()
  @IsEnum(ExternalTransactionStatus)
  status?: ExternalTransactionStatus;
}
