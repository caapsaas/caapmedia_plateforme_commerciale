import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateTreasuryAccountDto {
  @IsString({ message: 'Le nom du compte doit être du texte.' })
  @IsNotEmpty({ message: 'Le nom du compte est obligatoire.' })
  accountName: string;

  @IsNumber({}, { message: 'Le solde initial doit être un montant valide.' })
  @Min(0, { message: 'Le solde initial ne peut pas être négatif.' })
  @Max(9_999_999_999_999.99, {
    message: 'Le solde initial dépasse le montant maximal autorisé.',
  })
  @IsNotEmpty({ message: 'Le solde initial est obligatoire.' })
  initialBalance: number;

  @IsString({ message: 'La devise doit être du texte.' })
  @IsNotEmpty({ message: 'La devise est obligatoire.' })
  currency: string;

  @IsEnum(AccountType, {
    message: 'Sélectionnez un type de compte de trésorerie valide.',
  })
  @IsNotEmpty({ message: 'Le type de compte est obligatoire.' })
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
