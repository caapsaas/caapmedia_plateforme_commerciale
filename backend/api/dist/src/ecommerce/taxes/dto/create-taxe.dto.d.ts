export declare class CreateTaxDto {
    taxRatesName: string;
    rate: number;
    isDefault?: boolean;
    description?: string;
}
declare const UpdateTaxDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateTaxDto>>;
export declare class UpdateTaxDto extends UpdateTaxDto_base {
}
export {};
