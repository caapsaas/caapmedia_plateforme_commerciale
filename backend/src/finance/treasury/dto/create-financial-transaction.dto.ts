import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  IsUUID,
  IsPositive,
  MaxLength,
} from 'class-validator';
import { TransactionType, TransactionStatus, Prisma } from '@prisma/client';

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

  @IsString()
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

  // Décaissement complet (Phase A/B) : créer en EN_ATTENTE pour valider plus
  // tard via PATCH .../status (le solde n'est débité/crédité qu'à la validation).
  // Par défaut VALIDE (comportement historique inchangé).
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;
}
