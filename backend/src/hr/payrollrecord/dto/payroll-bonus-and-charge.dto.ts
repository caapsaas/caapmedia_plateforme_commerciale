import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';

/**
 * DTOs pour les endpoints de gestion des bonus et charges patronales
 */

// ============================================================
// BONUS
// ============================================================

export class GenerateThirteenthMonthDto {
  @IsString()
  employeeId: string;

  @IsString()
  month: string; // ex. '2024-12'

  @IsString()
  year: string; // ex. '2024'
}

export class ApproveBonusDto {
  @IsUUID()
  bonusId: string;
}

export class RecordBonusPaymentDto {
  @IsUUID()
  bonusId: string;

  @IsString()
  bankTransferId: string;

  @IsOptional()
  paymentDate?: string; // ISO date string
}

export class CancelBonusDto {
  @IsUUID()
  bonusId: string;

  @IsString()
  reason: string;
}

// ============================================================
// CHARGES PATRONALES
// ============================================================

export class AccumulateChargesDto {
  @IsString()
  month: string; // ex. '2024-08'

  @IsOptional()
  @IsString()
  subsidiaryId?: string; // Optionnel: si SUPER_ADMIN veut spécifier une filiale
}

export class RecordChargePaymentDto {
  @IsUUID()
  chargePaymentId: string;

  @IsString()
  bankTransferId: string;

  @IsNumber()
  paidAmount: number;

  @IsOptional()
  @IsString()
  declarationNumber?: string;
}

export class CreateSalaryChargeDto {
  @IsString()
  month: string; // ex. '2024-08'

  @IsString()
  paymentMethod: string; // 'BANK_TRANSFER', 'CHECK', ou 'CASH'

  @IsOptional()
  @IsString()
  subsidiaryId?: string;
}
