import { PrismaService } from "../../../common/utils/prisma/prisma.service";
import { Prisma, SpecFieldType } from '@prisma/client';
import { CreateSpecGroupDto, CreateSpecificationDto, ReorderSpecificationsDto, UpdateSpecGroupDto, UpdateSpecificationDto } from './dto/product-spec.dto';
export interface ResolvedOption {
    value: string;
    label: string;
}
export interface FormDefinitionSpec {
    id: string;
    groupId: string | null;
    name: string;
    technicalKey: string;
    type: SpecFieldType;
    required: boolean;
    defaultValue: unknown;
    possibleValues: ResolvedOption[] | null;
    order: number;
    helpText: string | null;
    placeholder: string | null;
    unit: string | null;
    visibleToClient: boolean;
    visibleToProduction: boolean;
    editableAfterValidation: boolean;
    searchable: boolean;
    typeConfig: unknown;
    rules: unknown;
}
export interface FormDefinitionGroup {
    id: string;
    name: string;
    order: number;
    specifications: FormDefinitionSpec[];
}
export interface FormDefinition {
    productId: string;
    groups: FormDefinitionGroup[];
    ungroupedSpecifications: FormDefinitionSpec[];
}
export declare class ProductSpecsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private assertServiceExists;
    createGroup(productId: string, dto: CreateSpecGroupDto): Promise<{
        id: string;
        name: string;
        productId: string;
        order: number;
    }>;
    updateGroup(groupId: string, dto: UpdateSpecGroupDto): Promise<{
        id: string;
        name: string;
        productId: string;
        order: number;
    }>;
    removeGroup(groupId: string): Promise<{
        id: string;
    }>;
    private findGroupOrThrow;
    createSpecification(productId: string, dto: CreateSpecificationDto): Promise<{
        type: import("@prisma/client").$Enums.SpecFieldType;
        required: boolean;
        id: string;
        name: string;
        unit: string | null;
        productId: string;
        order: number;
        helpText: string | null;
        typeConfig: Prisma.JsonValue | null;
        possibleValues: Prisma.JsonValue | null;
        defaultValue: Prisma.JsonValue | null;
        placeholder: string | null;
        groupId: string | null;
        technicalKey: string;
        visibleToClient: boolean;
        visibleToProduction: boolean;
        editableAfterValidation: boolean;
        searchable: boolean;
        internalDescription: string | null;
        rules: Prisma.JsonValue | null;
    }>;
    updateSpecification(specId: string, dto: UpdateSpecificationDto): Promise<{
        type: import("@prisma/client").$Enums.SpecFieldType;
        required: boolean;
        id: string;
        name: string;
        unit: string | null;
        productId: string;
        order: number;
        helpText: string | null;
        typeConfig: Prisma.JsonValue | null;
        possibleValues: Prisma.JsonValue | null;
        defaultValue: Prisma.JsonValue | null;
        placeholder: string | null;
        groupId: string | null;
        technicalKey: string;
        visibleToClient: boolean;
        visibleToProduction: boolean;
        editableAfterValidation: boolean;
        searchable: boolean;
        internalDescription: string | null;
        rules: Prisma.JsonValue | null;
    }>;
    removeSpecification(specId: string): Promise<{
        id: string;
    }>;
    private findSpecOrThrow;
    reorderSpecifications(productId: string, dto: ReorderSpecificationsDto): Promise<FormDefinition>;
    getBuilderStructure(productId: string): Promise<{
        groups: {
            specifications: {
                type: import("@prisma/client").$Enums.SpecFieldType;
                required: boolean;
                id: string;
                name: string;
                unit: string | null;
                productId: string;
                order: number;
                helpText: string | null;
                typeConfig: Prisma.JsonValue | null;
                possibleValues: Prisma.JsonValue | null;
                defaultValue: Prisma.JsonValue | null;
                placeholder: string | null;
                groupId: string | null;
                technicalKey: string;
                visibleToClient: boolean;
                visibleToProduction: boolean;
                editableAfterValidation: boolean;
                searchable: boolean;
                internalDescription: string | null;
                rules: Prisma.JsonValue | null;
            }[];
            id: string;
            name: string;
            productId: string;
            order: number;
        }[];
        ungroupedSpecifications: {
            type: import("@prisma/client").$Enums.SpecFieldType;
            required: boolean;
            id: string;
            name: string;
            unit: string | null;
            productId: string;
            order: number;
            helpText: string | null;
            typeConfig: Prisma.JsonValue | null;
            possibleValues: Prisma.JsonValue | null;
            defaultValue: Prisma.JsonValue | null;
            placeholder: string | null;
            groupId: string | null;
            technicalKey: string;
            visibleToClient: boolean;
            visibleToProduction: boolean;
            editableAfterValidation: boolean;
            searchable: boolean;
            internalDescription: string | null;
            rules: Prisma.JsonValue | null;
        }[];
    }>;
    getFormDefinition(productId: string): Promise<FormDefinition>;
    private getReferenceListKey;
    private resolvePossibleValues;
    validateAgainstDefinition(definition: FormDefinition, specValues: Record<string, unknown> | null | undefined): void;
    validateSpecValues(productId: string, specValues: Record<string, unknown> | null | undefined): Promise<FormDefinition>;
}
