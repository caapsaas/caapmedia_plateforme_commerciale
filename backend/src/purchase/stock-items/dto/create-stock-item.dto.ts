import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
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

  @IsNumber()
  @IsOptional()
  price?: number;

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

  @IsUUID()
  @IsOptional()
  mainSupplierId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Unité dans laquelle le stock de ce produit est réellement compté
  // (Chantier 2) — ex. Feuille. Les unités d'achat s'y convertissent.
  @IsUUID()
  @IsOptional()
  baseUnitId?: string;
}

export class UpdateStockItemDto extends PartialType(CreateStockItemDto) {}

export class UpdateStockItemPriceDto {
  @IsNumber()
  @IsPositive()
  price: number;
}

// Unité d'emballage/achat d'un produit de stock (ex. Rame = 500 Feuilles).
export class CreatePackagingUnitDto {
  @IsUUID()
  @IsNotEmpty()
  unitId: string;

  @IsNumber()
  @IsPositive()
  conversionFactor: number;
}

export class UpdatePackagingUnitDto extends PartialType(
  CreatePackagingUnitDto,
) {}
