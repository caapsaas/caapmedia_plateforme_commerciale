import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TransactionStatus } from '@prisma/client';

export class UpdateTransactionStatusDto {
  @IsEnum(TransactionStatus)
  @IsNotEmpty()
  status: TransactionStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bankFees?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
