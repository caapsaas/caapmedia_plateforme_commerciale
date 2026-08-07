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
  Min,
  ValidateNested,
} from 'class-validator';
import { StockMovementType } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

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

// Item.id/Subsidiary.id/Order.id sont des ids préfixés custom
// (generateId(ID_PREFIXES.X)), jamais des UUID — @IsUUID() cassait
// silencieusement (400) tout le module Stock Movements (mouvements manuels,
// ajustement d'inventaire, prélèvement pour commande).
export class CreateStockMovementDto {
  @IsString()
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
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsNumber()
  @Min(0)
  countedStock: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsOptional()
  @IsString()
  subsidiaryId?: string;
}

class WithdrawItemDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class WithdrawForOrderDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WithdrawItemDto)
  items: WithdrawItemDto[];
}

export class FindStockMovementsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  subsidiaryId?: string;

  @IsOptional()
  @IsString()
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
