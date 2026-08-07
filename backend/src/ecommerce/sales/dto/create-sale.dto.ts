import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CustomerPaymentMethod } from '@prisma/client';

class DirectSaleItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  productName: string;

  // Prix négocié pour cette vente au comptoir (jamais tiré du catalogue).
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  assemblyPrice?: number;

  // Spécifications techniques saisies au comptoir (Chantier 5), validées
  // côté serveur contre la définition du service — voir sales.service.ts.
  @IsOptional()
  @IsObject()
  specValues?: Record<string, unknown>;
}

export class CreateDirectSaleDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsNotEmpty()
  @IsEnum(CustomerPaymentMethod)
  paymentMethod: CustomerPaymentMethod;

  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  applyTax?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DirectSaleItemDto)
  items: DirectSaleItemDto[];
}
