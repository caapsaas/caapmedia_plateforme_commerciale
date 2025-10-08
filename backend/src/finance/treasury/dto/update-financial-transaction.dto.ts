import { IsEnum, IsNotEmpty } from 'class-validator';
import { TransactionStatus } from '@prisma/client';

export class UpdateFinancialTransactionDto {
  @IsEnum(TransactionStatus)
  @IsNotEmpty()
  status: TransactionStatus;
}
