export declare class CreateStockItemDto {
    name: string;
    category: string;
    description: string;
    sku?: string;
    stock?: number;
    warehouse: string;
    productRange?: string;
    minThreshold?: number;
    stockManaged?: boolean;
    mainSupplierId?: string;
    isActive?: boolean;
    baseUnitId?: string;
}
declare const UpdateStockItemDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateStockItemDto>>;
export declare class UpdateStockItemDto extends UpdateStockItemDto_base {
}
export declare class CreatePackagingUnitDto {
    unitId: string;
    conversionFactor: number;
}
declare const UpdatePackagingUnitDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePackagingUnitDto>>;
export declare class UpdatePackagingUnitDto extends UpdatePackagingUnitDto_base {
}
export {};
