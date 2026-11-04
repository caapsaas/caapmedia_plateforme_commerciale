export declare class CreateReferenceListDto {
    key: string;
    name: string;
}
declare const UpdateReferenceListDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateReferenceListDto>>;
export declare class UpdateReferenceListDto extends UpdateReferenceListDto_base {
}
export declare class CreateReferenceValueDto {
    value: string;
    label: string;
    order?: number;
}
declare const UpdateReferenceValueDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateReferenceValueDto>>;
export declare class UpdateReferenceValueDto extends UpdateReferenceValueDto_base {
}
export {};
