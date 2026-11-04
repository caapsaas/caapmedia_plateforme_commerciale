import { StockMovementsService } from './stock-movements.service';
import { CreateStockMovementDto, FindStockMovementsDto, InventoryAdjustmentDto, WithdrawForOrderDto } from './dto/stock-movement.dto';
export declare class StockMovementsController {
    private readonly stockMovementsService;
    constructor(stockMovementsService: StockMovementsService);
    findAll(query: FindStockMovementsDto, req: any): Promise<import("../../common/pagination/pagination").PaginatedResult<{
        type: import("@prisma/client").$Enums.StockMovementType;
        id: string;
        subsidiaryId: string;
        itemId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        purchaseOrderId: string | null;
        orderId: string | null;
        createdAt: Date;
        reason: string | null;
        createdById: string | null;
    }>>;
    create(dto: CreateStockMovementDto, req: any): Promise<{
        type: import("@prisma/client").$Enums.StockMovementType;
        id: string;
        subsidiaryId: string;
        itemId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        purchaseOrderId: string | null;
        orderId: string | null;
        createdAt: Date;
        reason: string | null;
        createdById: string | null;
    }>;
    adjustInventory(dto: InventoryAdjustmentDto, req: any): Promise<{
        adjusted: boolean;
        stock: number;
        movement: {
            type: import("@prisma/client").$Enums.StockMovementType;
            id: string;
            subsidiaryId: string;
            itemId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            purchaseOrderId: string | null;
            orderId: string | null;
            createdAt: Date;
            reason: string | null;
            createdById: string | null;
        };
    } | {
        adjusted: boolean;
        stock: number;
    }>;
    withdrawForOrder(dto: WithdrawForOrderDto, req: any): Promise<{
        type: import("@prisma/client").$Enums.StockMovementType;
        id: string;
        subsidiaryId: string;
        itemId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        purchaseOrderId: string | null;
        orderId: string | null;
        createdAt: Date;
        reason: string | null;
        createdById: string | null;
    }[]>;
}
