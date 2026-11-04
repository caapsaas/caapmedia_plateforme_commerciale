import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { ProductImageStorage } from './product-image-storage';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
import type { Prisma } from '@prisma/client';
export declare class ProductsService {
    private readonly prisma;
    private readonly imageStorage;
    constructor(prisma: PrismaService, imageStorage: ProductImageStorage);
    private includeAll;
    private mapDecimals;
    create(createProductDto: CreateProductDto, files: Express.Multer.File[]): Promise<{
        productImages: {
            id: string;
            imageName: string;
            imageUrl: string;
            productId: string | null;
        }[];
    } & {
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
    }>;
    findAll(paginationQuery?: PaginationQueryDto): Promise<{
        data: ({
            productImages: {
                id: string;
                imageName: string;
                imageUrl: string;
                productId: string | null;
            }[];
        } & {
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
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    findMany(page: number, category?: string): Promise<({
        productImages: {
            id: string;
            imageName: string;
            imageUrl: string;
            productId: string | null;
        }[];
    } & {
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
    })[]>;
    searchProducts(query: string): Promise<({
        productImages: {
            id: string;
            imageName: string;
            imageUrl: string;
            productId: string | null;
        }[];
    } & {
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
    })[]>;
    findPublicShare(id: string): Promise<{
        description: string;
        id: string;
        name: string;
        productImages: {
            id: string;
            imageUrl: string;
        }[];
    }>;
    getFavorites(ids: string[]): Promise<{
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
    }[]>;
    findOne(id: string): Promise<{
        productImages: {
            id: string;
            imageName: string;
            imageUrl: string;
            productId: string | null;
        }[];
    } & {
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
    }>;
    update(id: string, updateProductDto: UpdateProductDto, files: Express.Multer.File[]): Promise<{
        productImages: {
            id: string;
            imageName: string;
            imageUrl: string;
            productId: string | null;
        }[];
    } & {
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
    }>;
    remove(id: string): Promise<{
        success: boolean;
        id: string;
    }>;
}
