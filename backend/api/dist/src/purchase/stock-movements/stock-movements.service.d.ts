import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { Prisma } from '@prisma/client';
import { CreateStockMovementDto, FindStockMovementsDto, InventoryAdjustmentDto, WithdrawForOrderDto } from './dto/stock-movement.dto';
export declare const IN_MOVEMENT_TYPES: Set<import("@prisma/client").$Enums.StockMovementType>;
export declare class StockMovementsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(user: any, query: FindStockMovementsDto): Promise<import("src/common/pagination/pagination").PaginatedResult<{
        type: import("@prisma/client").$Enums.StockMovementType;
        id: string;
        subsidiaryId: string;
        itemId: string;
        quantity: Prisma.Decimal;
        purchaseOrderId: string | null;
        orderId: string | null;
        createdAt: Date;
        reason: string | null;
        createdById: string | null;
    }>>;
    createManual(dto: CreateStockMovementDto, user: any): Promise<{
        type: import("@prisma/client").$Enums.StockMovementType;
        id: string;
        subsidiaryId: string;
        itemId: string;
        quantity: Prisma.Decimal;
        purchaseOrderId: string | null;
        orderId: string | null;
        createdAt: Date;
        reason: string | null;
        createdById: string | null;
    }>;
    adjustInventory(dto: InventoryAdjustmentDto, user: any): Promise<{
        adjusted: boolean;
        stock: number;
        movement: {
            type: import("@prisma/client").$Enums.StockMovementType;
            id: string;
            subsidiaryId: string;
            itemId: string;
            quantity: Prisma.Decimal;
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
    withdrawForOrder(dto: WithdrawForOrderDto, user: any): Promise<{
        type: import("@prisma/client").$Enums.StockMovementType;
        id: string;
        subsidiaryId: string;
        itemId: string;
        quantity: Prisma.Decimal;
        purchaseOrderId: string | null;
        orderId: string | null;
        createdAt: Date;
        reason: string | null;
        createdById: string | null;
    }[]>;
}
