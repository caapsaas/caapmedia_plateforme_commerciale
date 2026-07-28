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
import { Transform, Type } from 'class-transformer';
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

export class UpdateProductDto extends PartialType(CreateProductDto) {
  // URLs des images existantes à conserver — permet de retirer une image
  // individuellement sans supprimer tout le lot au prochain upload.
  // multer/multipart ne renvoie un tableau que s'il y a 2+ occurrences du
  // champ ; avec 0 ou 1 image conservée, la valeur arrive en string brute -
  // on la normalise en tableau avant validation.
  @Transform(({ value }) =>
    value === undefined ? value : Array.isArray(value) ? value : [value],
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  existingImages?: string[];
}
