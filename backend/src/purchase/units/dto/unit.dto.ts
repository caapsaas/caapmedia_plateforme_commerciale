import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// Référentiel d'unités de mesure (Chantier 2) — ex. Feuille, Rame, Rouleau,
// Kilogramme, Mètre... partagé par tous les produits de stock.
export class CreateUnitDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  symbol?: string;
}

export class UpdateUnitDto extends PartialType(CreateUnitDto) {}
