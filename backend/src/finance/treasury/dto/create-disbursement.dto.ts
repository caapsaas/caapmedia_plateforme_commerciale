import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  IsPositive,
  MaxLength,
} from 'class-validator';
import {
  TreasuryTransactionType,
  CounterpartyType,
  TransactionStatus,
} from '@prisma/client';

// Décaissement typé (coffre-fort, banque, caisse dépense) et virement
// inter-comptes trésorerie (Phase B) — distinct du flux simple
// income/expense (CreateFinancialTransactionDto), qui reste inchangé.
export class CreateDisbursementDto {
  @IsDateString()
  @IsNotEmpty()
  transactionDate: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  sourceAccountId: string;

  // Uniquement pour un virement inter-comptes (BANK_WITHDRAWAL, CASH_REFILL).
  @IsString()
  @IsOptional()
  destinationAccountId?: string;

  @IsEnum(TreasuryTransactionType)
  @IsNotEmpty()
  treasuryType: TreasuryTransactionType;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  reference?: string;

  // Tiers existant, ou création à la volée via newCounterpartyName/-Type.
  @IsString()
  @IsOptional()
  counterpartyId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  newCounterpartyName?: string;

  @IsEnum(CounterpartyType)
  @IsOptional()
  newCounterpartyType?: CounterpartyType;

  // EN_ATTENTE pour valider plus tard via PATCH .../status ; VALIDE par défaut.
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;
}
