import { SpecFieldType } from '@prisma/client';
export declare class CreateSpecGroupDto {
    name: string;
    order?: number;
}
declare const UpdateSpecGroupDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateSpecGroupDto>>;
export declare class UpdateSpecGroupDto extends UpdateSpecGroupDto_base {
}
export declare class CreateSpecificationDto {
    groupId?: string;
    name: string;
    technicalKey: string;
    type: SpecFieldType;
    required?: boolean;
    defaultValue?: unknown;
    possibleValues?: unknown;
    order?: number;
    helpText?: string;
    placeholder?: string;
    unit?: string;
    visibleToClient?: boolean;
    visibleToProduction?: boolean;
    editableAfterValidation?: boolean;
    searchable?: boolean;
    internalDescription?: string;
    typeConfig?: Record<string, unknown>;
    rules?: unknown[];
}
declare const UpdateSpecificationDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateSpecificationDto>>;
export declare class UpdateSpecificationDto extends UpdateSpecificationDto_base {
}
declare class ReorderItemDto {
    id: string;
    order: number;
    groupId?: string | null;
}
export declare class ReorderSpecificationsDto {
    items: ReorderItemDto[];
}
export {};
