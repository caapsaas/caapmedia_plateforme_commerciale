import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { CreatePackagingUnitDto, CreateStockItemDto, UpdatePackagingUnitDto, UpdateStockItemDto } from './dto/create-stock-item.dto';
import { ItemPackagingUnit, Unit } from '@prisma/client';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
import type { Prisma } from '@prisma/client';
export declare class StockItemsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toFlat;
    private toFlatConsolidated;
    private getLatestCostPrices;
    create(createStockItemDto: CreateStockItemDto, user: any): Promise<{
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
        minThreshold: Prisma.Decimal | null;
        stockManaged: boolean;
        mainSupplierId: string | null;
        baseUnitId: string | null;
        baseUnit: Unit | null;
        packagingUnits: (ItemPackagingUnit & {
            unit: Unit;
        })[];
    }>;
    findAll(user: any, paginationQuery: PaginationQueryDto, subsidiaryId?: string): Promise<{
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
            minThreshold: Prisma.Decimal | null;
            stockManaged: boolean;
            mainSupplierId: string | null;
            baseUnitId: string | null;
            baseUnit: Unit | null;
            packagingUnits: (ItemPackagingUnit & {
                unit: Unit;
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
    findOne(id: string, user: any): Promise<{
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
        minThreshold: Prisma.Decimal | null;
        stockManaged: boolean;
        mainSupplierId: string | null;
        baseUnitId: string | null;
        baseUnit: Unit | null;
        packagingUnits: (ItemPackagingUnit & {
            unit: Unit;
        })[];
    }>;
    update(id: string, updateStockItemDto: UpdateStockItemDto, user: any): Promise<{
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
        minThreshold: Prisma.Decimal | null;
        stockManaged: boolean;
        mainSupplierId: string | null;
        baseUnitId: string | null;
        baseUnit: Unit | null;
        packagingUnits: (ItemPackagingUnit & {
            unit: Unit;
        })[];
    }>;
    remove(id: string, user: any): Promise<{
        id: string;
    }>;
    listPackagingUnits(itemId: string, user: any): Promise<({
        unit: {
            symbol: string | null;
            id: string;
            name: string;
        };
    } & {
        id: string;
        itemId: string;
        unitId: string;
        conversionFactor: Prisma.Decimal;
    })[]>;
    addPackagingUnit(itemId: string, dto: CreatePackagingUnitDto, user: any): Promise<{
        unit: {
            symbol: string | null;
            id: string;
            name: string;
        };
    } & {
        id: string;
        itemId: string;
        unitId: string;
        conversionFactor: Prisma.Decimal;
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
        conversionFactor: Prisma.Decimal;
    }>;
    removePackagingUnit(packagingUnitId: string): Promise<{
        id: string;
    }>;
    private findPackagingUnitOrThrow;
}
