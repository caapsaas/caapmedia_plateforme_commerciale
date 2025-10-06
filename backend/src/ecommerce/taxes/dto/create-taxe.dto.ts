import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateTaxDto {
  @IsString()
  @IsNotEmpty()
  taxRatesName: string;

  @IsNumber()
  @Min(0)
  @Max(1) // Le taux est un pourcentage, donc entre 0 et 1 (ex: 0.1925 pour 19.25%)
  rate: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateTaxDto extends PartialType(CreateTaxDto) {}

