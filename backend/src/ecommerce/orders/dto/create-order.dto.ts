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
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderSource } from '@prisma/client';
import { OrderStatus, CustomerPaymentMethod } from '@prisma/client';
import { ProductionStatus } from '@prisma/client';

class CreateProductOptionDto {
  @IsString()
  @IsNotEmpty()
  optionType: string;

  @IsString()
  @IsNotEmpty()
  optionValue: string;
}

class CreateOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  // Prix négocié par le commercial pour cette ligne (jamais tiré du catalogue).
  @IsNumber()
  @Min(0)
  unitPrice: number;

  // Remise négociée sur cette ligne (montant, pas %), figée historiquement avec le total.
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  designFileName?: string;

  @IsOptional()
  @IsString()
  designFileUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductOptionDto)
  options?: CreateProductOptionDto[];

  // Valeurs des spécifications techniques du produit (Chantier 5) —
  // { technicalKey: valeur }, validées server-side contre la définition du produit.
  @IsOptional()
  @IsObject()
  specValues?: Record<string, unknown>;
}

export class CreateOrderBySalesRepDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  paymentDueDate: string;

  @IsNotEmpty()
  @IsEnum(CustomerPaymentMethod)
  paymentMethod: CustomerPaymentMethod;

  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @IsNotEmpty()
  @IsEnum(OrderSource)
  source: OrderSource;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class RecordPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNotEmpty()
  @IsEnum(CustomerPaymentMethod)
  paymentMethod: CustomerPaymentMethod;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}

export class updateProductionStatusDto {
  @IsEnum(ProductionStatus)
  @IsNotEmpty()
  productionStatus: ProductionStatus;
}
