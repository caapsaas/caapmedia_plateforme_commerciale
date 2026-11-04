import type { Request, Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
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
        minThreshold: import("@prisma/client/runtime/library").Decimal | null;
        stockManaged: boolean;
        mainSupplierId: string | null;
        baseUnitId: string | null;
    }>;
    findAll(paginationQuery: PaginationQueryDto): Promise<{
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
            minThreshold: import("@prisma/client/runtime/library").Decimal | null;
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
    findAllProducts(page: string, category?: string): Promise<({
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
        minThreshold: import("@prisma/client/runtime/library").Decimal | null;
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
        minThreshold: import("@prisma/client/runtime/library").Decimal | null;
        stockManaged: boolean;
        mainSupplierId: string | null;
        baseUnitId: string | null;
    })[]>;
    getFavorites(body: {
        ids: string[];
    }): Promise<{
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
    }[]>;
    share(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
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
        minThreshold: import("@prisma/client/runtime/library").Decimal | null;
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
        minThreshold: import("@prisma/client/runtime/library").Decimal | null;
        stockManaged: boolean;
        mainSupplierId: string | null;
        baseUnitId: string | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        id: string;
    }>;
}
