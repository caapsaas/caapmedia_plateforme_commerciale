export declare class CreateSupplierDto {
    supplierName: string;
    company: string;
    email: string;
    phone: string;
    address: string;
}
declare const UpdateSupplierDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateSupplierDto>>;
export declare class UpdateSupplierDto extends UpdateSupplierDto_base {
}
export {};
