// src/products/dto/create-product.dto.ts
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class ProductImageDto {
  @IsString()
  @IsNotEmpty()
  imageName: string;

  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;
}

// Catalogue de services (Chantier 1) : aucun prix, aucun stock — ces notions
// n'ont de sens que pour les produits de stock (voir purchase/stock-items).
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isVisibleOnSite?: boolean;

  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @IsOptional()
  productImages?: ProductImageDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
