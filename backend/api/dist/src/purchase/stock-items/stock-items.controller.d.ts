import { StockItemsService } from './stock-items.service';
import { CreatePackagingUnitDto, CreateStockItemDto, UpdatePackagingUnitDto, UpdateStockItemDto } from './dto/create-stock-item.dto';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class StockItemsController {
    private readonly stockItemsService;
    constructor(stockItemsService: StockItemsService);
    create(createStockItemDto: CreateStockItemDto, req: any): Promise<{
        stock: number;
        warehouse: string;
        subsidiaryId: string;
        costPrice: number;
        type: import("@prisma/client").$Enums.ItemType;
        description: string;
        id: string;
        name: string;
        category: string;
        productRange: string | null;
        isActive: boolean;
        isVisibleOnSite: boolean;
        displayOrder: number | null;
        sku: string | null;
        minThreshold: import("@prisma/client/runtime/library").Decimal | null;
        stockManaged: boolean;
        mainSupplierId: string | null;
        baseUnitId: string | null;
        baseUnit: import("@prisma/client").Unit | null;
        packagingUnits: (import("@prisma/client").ItemPackagingUnit & {
            unit: import("@prisma/client").Unit;
        })[];
    }>;
    findAll(req: any, paginationQuery: PaginationQueryDto, subsidiaryId?: string): Promise<{
        data: {
            stock: number;
            warehouse: string;
            subsidiaryId: string;
            costPrice: number;
            type: import("@prisma/client").$Enums.ItemType;
            description: string;
            id: string;
            name: string;
            category: string;
            productRange: string | null;
            isActive: boolean;
            isVisibleOnSite: boolean;
            displayOrder: number | null;
            sku: string | null;
            minThreshold: import("@prisma/client/runtime/library").Decimal | null;
            stockManaged: boolean;
            mainSupplierId: string | null;
            baseUnitId: string | null;
            baseUnit: import("@prisma/client").Unit | null;
            packagingUnits: (import("@prisma/client").ItemPackagingUnit & {
                unit: import("@prisma/client").Unit;
            })[];
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    findOne(id: string, req: any): Promise<{
        stock: number;
        warehouse: string;
        subsidiaryId: string;
        costPrice: number;
        type: import("@prisma/client").$Enums.ItemType;
        description: string;
        id: string;
        name: string;
        category: string;
        productRange: string | null;
        isActive: boolean;
        isVisibleOnSite: boolean;
        displayOrder: number | null;
        sku: string | null;
        minThreshold: import("@prisma/client/runtime/library").Decimal | null;
        stockManaged: boolean;
        mainSupplierId: string | null;
        baseUnitId: string | null;
        baseUnit: import("@prisma/client").Unit | null;
        packagingUnits: (import("@prisma/client").ItemPackagingUnit & {
            unit: import("@prisma/client").Unit;
        })[];
    }>;
    update(id: string, updateStockItemDto: UpdateStockItemDto, req: any): Promise<{
        stock: number;
        warehouse: string;
        subsidiaryId: string;
        costPrice: number;
        type: import("@prisma/client").$Enums.ItemType;
        description: string;
        id: string;
        name: string;
        category: string;
        productRange: string | null;
        isActive: boolean;
        isVisibleOnSite: boolean;
        displayOrder: number | null;
        sku: string | null;
        minThreshold: import("@prisma/client/runtime/library").Decimal | null;
        stockManaged: boolean;
        mainSupplierId: string | null;
        baseUnitId: string | null;
        baseUnit: import("@prisma/client").Unit | null;
        packagingUnits: (import("@prisma/client").ItemPackagingUnit & {
            unit: import("@prisma/client").Unit;
        })[];
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
    }>;
    listPackagingUnits(id: string, req: any): Promise<({
        unit: {
            symbol: string | null;
            id: string;
            name: string;
        };
    } & {
        id: string;
        itemId: string;
        unitId: string;
        conversionFactor: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    addPackagingUnit(id: string, dto: CreatePackagingUnitDto, req: any): Promise<{
        unit: {
            symbol: string | null;
            id: string;
            name: string;
        };
    } & {
        id: string;
        itemId: string;
        unitId: string;
        conversionFactor: import("@prisma/client/runtime/library").Decimal;
    }>;
    updatePackagingUnit(packagingUnitId: string, dto: UpdatePackagingUnitDto): Promise<{
        unit: {
            symbol: string | null;
            id: string;
            name: string;
        };
    } & {
        id: string;
        itemId: string;
        unitId: string;
        conversionFactor: import("@prisma/client/runtime/library").Decimal;
    }>;
    removePackagingUnit(packagingUnitId: string): Promise<{
        id: string;
    }>;
}
