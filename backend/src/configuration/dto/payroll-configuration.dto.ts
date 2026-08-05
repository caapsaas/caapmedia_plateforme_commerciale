import {
  IsDecimal,
  IsString,
  IsDate,
  IsOptional,
  Min,
  Max,
  Matches,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TaxBracketDto {
  @IsNumber({}, { message: 'Le salaire minimum doit être un nombre' })
  @Min(0, { message: 'Le salaire minimum ne peut pas être négatif' })
  @IsOptional()
  minSalary?: number;

  @IsNumber({}, { message: 'Le salaire maximum doit être un nombre' })
  @Min(0, { message: 'Le salaire maximum ne peut pas être négatif' })
  @IsOptional()
  maxSalary?: number | null;

  @IsNumber({}, { message: 'Le taux doit être un nombre' })
  @Min(0, { message: 'Le taux ne peut pas être négatif' })
  @Max(1, { message: 'Le taux ne peut pas dépasser 100%' })
  rate: number;

  @IsNumber({}, { message: 'La déduction doit être un nombre' })
  @Min(0, { message: 'La déduction ne peut pas être négative' })
  @IsOptional()
  deductible?: number;
}

export class LeaveEntitlementDto {
  @IsString()
  type: string;

  @IsInt()
  @Min(0, { message: 'Les jours de congé ne peuvent pas être négatifs' })
  @Max(365, { message: 'Les jours de congé ne peuvent pas dépasser 365' })
  daysPerYear: number;

  @IsBoolean()
  isPaid: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreatePayrollConfigDto {
  @IsString()
  subsidiaryId: string;

  @IsDecimal({ decimal_digits: '1,2' })
  @Min(50000, { message: 'Le salaire minimum doit être au moins 50000 FCFA' })
  @Max(500000, {
    message: 'Le salaire minimum ne peut pas dépasser 500000 FCFA',
  })
  minWage: number;

  @IsString()
  @IsOptional()
  minWagePeriod?: string;

  @IsDate()
  minWageEffectiveDate: Date;

  @IsDecimal({ decimal_digits: '1,4' })
  @Min(0, { message: 'Le taux CNPS employé ne peut pas être négatif' })
  @Max(0.2, { message: 'Le taux CNPS employé ne peut pas dépasser 20%' })
  @IsOptional()
  cnpsEmployeeRate?: number;

  @IsDecimal({ decimal_digits: '1,4' })
  @Min(0, { message: 'Le taux CNPS employeur ne peut pas être négatif' })
  @Max(0.3, { message: 'Le taux CNPS employeur ne peut pas dépasser 30%' })
  @IsOptional()
  cnpsEmployerRate?: number;
}

export class UpdatePayrollConfigDto {
  @IsNumber({}, { message: 'Le salaire minimum doit être un nombre' })
  @Min(50000, { message: 'Le salaire minimum doit être au moins 50000 FCFA' })
  @Max(500000, {
    message: 'Le salaire minimum ne peut pas dépasser 500000 FCFA',
  })
  @IsOptional()
  minWage?: number;

  @IsString()
  @IsOptional()
  minWagePeriod?: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La date doit être au format YYYY-MM-DD',
  })
  @IsOptional()
  minWageEffectiveDate?: string;

  @IsNumber({}, { message: 'Le taux CNPS employé doit être un nombre' })
  @Min(0, { message: 'Le taux CNPS employé ne peut pas être négatif' })
  @Max(0.2, { message: 'Le taux CNPS employé ne peut pas dépasser 20%' })
  @IsOptional()
  cnpsEmployeeRate?: number;

  @IsNumber({}, { message: 'Le taux CNPS employeur doit être un nombre' })
  @Min(0, { message: 'Le taux CNPS employeur ne peut pas être négatif' })
  @Max(0.3, { message: 'Le taux CNPS employeur ne peut pas dépasser 30%' })
  @IsOptional()
  cnpsEmployerRate?: number;

  @IsNumber({}, { message: 'Le taux CFC employé doit être un nombre' })
  @Min(0, { message: 'Le taux CFC employé ne peut pas être négatif' })
  @Max(0.2, { message: 'Le taux CFC employé ne peut pas dépasser 20%' })
  @IsOptional()
  cfcEmployeeRate?: number;

  @IsNumber({}, { message: 'Le taux CFC employeur doit être un nombre' })
  @Min(0, { message: 'Le taux CFC employeur ne peut pas être négatif' })
  @Max(0.3, { message: 'Le taux CFC employeur ne peut pas dépasser 30%' })
  @IsOptional()
  cfcEmployerRate?: number;

  @IsNumber({}, { message: 'Le taux FNE doit être un nombre' })
  @Min(0, { message: 'Le taux FNE ne peut pas être négatif' })
  @Max(0.1, { message: 'Le taux FNE ne peut pas dépasser 10%' })
  @IsOptional()
  fneRate?: number;

  @IsNumber({}, { message: 'Le plafond CNPS doit être un nombre' })
  @Min(0, { message: 'Le plafond CNPS ne peut pas être négatif' })
  @IsOptional()
  cnpsCap?: number;

  @IsNumber(
    {},
    { message: "Le taux d'abattement professionnel doit être un nombre" },
  )
  @Min(0, {
    message: "Le taux d'abattement professionnel ne peut pas être négatif",
  })
  @Max(1, {
    message: "Le taux d'abattement professionnel ne peut pas dépasser 100%",
  })
  @IsOptional()
  professionalExpenseRate?: number;

  @IsNumber({}, { message: "L'abattement fixe annuel doit être un nombre" })
  @Min(0, { message: "L'abattement fixe annuel ne peut pas être négatif" })
  @IsOptional()
  fixedAbatementAnnual?: number;

  @IsNumber({}, { message: 'Le taux du groupe A doit être un nombre' })
  @Min(0, { message: 'Le taux du groupe A ne peut pas être négatif' })
  @Max(0.1, { message: 'Le taux du groupe A ne peut pas dépasser 10%' })
  @IsOptional()
  riskGroupARate?: number;

  @IsNumber({}, { message: 'Le taux du groupe B doit être un nombre' })
  @Min(0, { message: 'Le taux du groupe B ne peut pas être négatif' })
  @Max(0.15, { message: 'Le taux du groupe B ne peut pas dépasser 15%' })
  @IsOptional()
  riskGroupBRate?: number;

  @IsNumber({}, { message: 'Le taux du groupe C doit être un nombre' })
  @Min(0, { message: 'Le taux du groupe C ne peut pas être négatif' })
  @Max(0.2, { message: 'Le taux du groupe C ne peut pas dépasser 20%' })
  @IsOptional()
  riskGroupCRate?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxBracketDto)
  @IsOptional()
  irppBrackets?: TaxBracketDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeaveEntitlementDto)
  @IsOptional()
  leaveEntitlements?: LeaveEntitlementDto[];
}
