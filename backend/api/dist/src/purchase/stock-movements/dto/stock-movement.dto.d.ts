import { StockMovementType } from '@prisma/client';
import { PaginationQueryDto } from "../../../common/pagination/dto/pagination-query.dto";
export declare const MANUAL_MOVEMENT_TYPES: ("CUSTOMER_RETURN" | "TRANSFER_IN" | "TRANSFER_OUT" | "LOSS" | "BREAKAGE" | "INTERNAL_CONSUMPTION" | "SUPPLIER_RETURN")[];
export declare class CreateStockMovementDto {
    itemId: string;
    type: StockMovementType;
    quantity: number;
    reason?: string;
}
export declare class InventoryAdjustmentDto {
    itemId: string;
    countedStock: number;
    reason?: string;
    subsidiaryId?: string;
}
declare class WithdrawItemDto {
    itemId: string;
    quantity: number;
}
export declare class WithdrawForOrderDto {
    orderId: string;
    items: WithdrawItemDto[];
}
export declare class FindStockMovementsDto extends PaginationQueryDto {
    subsidiaryId?: string;
    itemId?: string;
    type?: StockMovementType;
    startDate?: string;
    endDate?: string;
}
export {};
