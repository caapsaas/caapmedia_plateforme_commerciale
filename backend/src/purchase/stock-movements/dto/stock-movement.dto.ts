import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { StockMovementType } from '@prisma/client';

// Types que l'utilisateur peut déclencher manuellement (Chantier 3) — les
// autres (PURCHASE_RECEIPT, PRODUCTION_CONSUMPTION, *_ADJUSTMENT) ont chacun
// leur propre flux dédié (réception d'achat, prélèvement matières, inventaire)
// pour garder les règles métier de chacun à un seul endroit.
export const MANUAL_MOVEMENT_TYPES = [
  StockMovementType.CUSTOMER_RETURN,
  StockMovementType.TRANSFER_IN,
  StockMovementType.TRANSFER_OUT,
  StockMovementType.LOSS,
  StockMovementType.BREAKAGE,
  StockMovementType.INTERNAL_CONSUMPTION,
  StockMovementType.SUPPLIER_RETURN,
];

export class CreateStockMovementDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsEnum(MANUAL_MOVEMENT_TYPES)
  type: StockMovementType;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class InventoryAdjustmentDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsNumber()
  @Min(0)
  countedStock: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

class WithdrawItemDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class WithdrawForOrderDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WithdrawItemDto)
  items: WithdrawItemDto[];
}

export class FindStockMovementsDto {
  @IsUUID()
  @IsOptional()
  itemId?: string;

  @IsEnum(StockMovementType)
  @IsOptional()
  type?: StockMovementType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
