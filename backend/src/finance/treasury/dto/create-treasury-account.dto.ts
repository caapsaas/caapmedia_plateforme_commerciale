import {
  IsString,
  IsNotEmpty,
  IsNumber,
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

  // Comptes CASH_REGISTER/EXPENSE_BOX : caissier responsable (Phase B/C).
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

  // Banque physique référencée (requis pour un compte BANQUE — voir
  // BankService). Un compte bancaire est toujours rattaché à la filiale
  // siège quel que soit ce champ (résolu côté service).
  @IsString()
  @IsOptional()
  bankId?: string;

  // Filiale cible — sélectionnable par ADMIN/SUPER_ADMIN ; les autres rôles
  // sont forcés sur leur propre filiale par le service.
  @IsString()
  @IsOptional()
  subsidiaryId?: string;
}
