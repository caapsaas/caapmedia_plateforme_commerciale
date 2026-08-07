import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// Produit de stock (Chantier 1) : matière première/consommable acheté et stocké
// en interne, scopé filiale — distinct du catalogue de services (voir ecommerce/products).
export class CreateStockItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsString()
  @IsNotEmpty()
  warehouse: string;

  @IsString()
  @IsOptional()
  productRange?: string;

  @IsNumber()
  @IsOptional()
  minThreshold?: number;

  @IsBoolean()
  @IsOptional()
  stockManaged?: boolean;

  // Supplier.id est un id préfixé custom (SUP-xxx), jamais un UUID.
  @IsString()
  @IsOptional()
  mainSupplierId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Unité dans laquelle le stock de ce produit est réellement compté
  // (Chantier 2) — ex. Feuille. Les unités d'achat s'y convertissent.
  // Unit.id est un id préfixé custom (UNT-xxx), jamais un UUID.
  @IsString()
  @IsOptional()
  baseUnitId?: string;
}

export class UpdateStockItemDto extends PartialType(CreateStockItemDto) {}

// Unité d'emballage/achat d'un produit de stock (ex. Rame = 500 Feuilles).
export class CreatePackagingUnitDto {
  // Unit.id est un id préfixé custom (UNT-xxx), jamais un UUID.
  @IsString()
  @IsNotEmpty()
  unitId: string;

  @IsNumber()
  @IsPositive()
  conversionFactor: number;
}

export class UpdatePackagingUnitDto extends PartialType(
  CreatePackagingUnitDto,
) {}
