import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

// On ne permet jamais de modifier `balance` ici pour éviter les incohérences
// de solde — il n'évolue que via les transactions (Phase A/C).
class UpdateableTreasuryAccount {
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsString()
  @IsOptional()
  cashierId?: string;

  @IsString()
  @IsOptional()
  accountCode?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;
}

export class UpdateTreasuryAccountDto extends PartialType(
  UpdateableTreasuryAccount,
) {}
