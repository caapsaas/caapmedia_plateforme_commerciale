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

class DirectSaleProductionStepDto {
  @IsString()
  @IsNotEmpty()
  equipmentId: string;

  @IsString()
  @IsNotEmpty()
  equipmentNameSnapshot: string;

  @IsInt()
  @Min(1)
  stepOrder: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  estimatedTimeHours: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hourlyRateSnapshot: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  calculatedCost: number;
}

class DirectSaleProductionSummaryDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalProductionCost: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  marginPercent: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalPrice: number;
}

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DirectSaleProductionStepDto)
  productionSteps?: DirectSaleProductionStepDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DirectSaleProductionSummaryDto)
  productionSummary?: DirectSaleProductionSummaryDto;
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
  cashRegisterId?: string;

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
