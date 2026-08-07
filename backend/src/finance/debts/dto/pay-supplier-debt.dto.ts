import {
  IsNotEmpty,
  IsDateString,
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
} from 'class-validator';

export class PaySupplierDebtDto {
  @IsString()
  @IsNotEmpty()
  treasuryAccountId: string;

  @IsDateString()
  @IsNotEmpty()
  paymentDate: string;

  // Paiement partiel : si omis, solde la dette intégralement.
  @IsNumber()
  @IsPositive()
  @IsOptional()
  amount?: number;
}
