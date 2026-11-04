export declare class CreateUnitDto {
    name: string;
    symbol?: string;
}
declare const UpdateUnitDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateUnitDto>>;
export declare class UpdateUnitDto extends UpdateUnitDto_base {
}
export {};
