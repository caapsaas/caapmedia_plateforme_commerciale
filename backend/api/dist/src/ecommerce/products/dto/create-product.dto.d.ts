export declare class ProductImageDto {
    imageName: string;
    imageUrl: string;
}
export declare class CreateProductDto {
    name: string;
    category: string;
    description: string;
    isActive?: boolean;
    isVisibleOnSite?: boolean;
    displayOrder?: number;
    productImages?: ProductImageDto[];
}
declare const UpdateProductDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateProductDto>>;
export declare class UpdateProductDto extends UpdateProductDto_base {
    existingImages?: string[];
}
export {};
