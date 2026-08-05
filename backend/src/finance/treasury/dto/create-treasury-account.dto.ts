import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateTreasuryAccountDto {
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsNumber()
  @IsNotEmpty()
  initialBalance: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsEnum(AccountType)
  @IsNotEmpty()
  accountType: AccountType;

  // Comptes CAISSE/CASH_REGISTER/EXPENSE_BOX : caissier responsable (Phase B/C).
  @IsString()
  @IsOptional()
  cashierId?: string;

  // Mapping comptable (compte du plan SYSCOHADA de type TRESORERIE).
  @IsString()
  @IsOptional()
  accountCode?: string;

  // Numéro de compte bancaire (comptes BANQUE).
  @IsString()
  @IsOptional()
  accountNumber?: string;
}
