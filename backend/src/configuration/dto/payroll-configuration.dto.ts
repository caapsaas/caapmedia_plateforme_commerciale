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
} from 'class-validator';
import { Type } from 'class-transformer';

export class TaxBracketDto {
  @IsDecimal({ decimal_digits: '1,2' })
  @Min(0, { message: 'Le salaire minimum ne peut pas être négatif' })
  @IsOptional()
  minSalary?: number;

  @IsDecimal({ decimal_digits: '1,2' })
  @Min(0, { message: 'Le salaire maximum ne peut pas être négatif' })
  @IsOptional()
  maxSalary?: number | null;

  @IsDecimal({ decimal_digits: '1,4' })
  @Min(0, { message: 'Le taux ne peut pas être négatif' })
  @Max(1, { message: 'Le taux ne peut pas dépasser 100%' })
  rate: number;

  @IsDecimal({ decimal_digits: '1,2' })
  @IsOptional()
  deductible?: number;
}

export class LeaveEntitlementDto {
  @IsString()
  type: string;

  @IsDecimal({ decimal_digits: '1,2' })
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
  @IsDecimal({ decimal_digits: '1,2' })
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
