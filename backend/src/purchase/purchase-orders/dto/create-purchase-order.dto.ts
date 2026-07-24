import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentTerms, PurchaseOrderStatus } from '@prisma/client';

class CreatePurchaseOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  purchasePrice: number;

  // Unité dans laquelle "quantity" est exprimée (Chantier 2) — absente =
  // unité de base du produit. La conversion se fait automatiquement à la
  // réception (voir PurchaseOrdersService.receiveItems), jamais ici.
  @IsUUID()
  @IsOptional()
  purchaseUnitId?: string;
}

export class CreatePurchaseOrderDto {
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @IsDateString()
  @IsNotEmpty()
  expectedDeliveryDate: string;

  @IsEnum(PaymentTerms)
  @IsNotEmpty()
  paymentTerms: PaymentTerms;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderStatusDto {
  @IsEnum(PurchaseOrderStatus)
  @IsNotEmpty()
  status: PurchaseOrderStatus;
}

export class RecordPurchasePaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;
}
