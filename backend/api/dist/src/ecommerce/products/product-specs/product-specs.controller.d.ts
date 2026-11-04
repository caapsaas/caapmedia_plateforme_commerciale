import { ProductSpecsService } from './product-specs.service';
import { CreateSpecGroupDto, CreateSpecificationDto, ReorderSpecificationsDto, UpdateSpecGroupDto, UpdateSpecificationDto } from './dto/product-spec.dto';
export declare class ProductSpecsController {
    private readonly productSpecsService;
    constructor(productSpecsService: ProductSpecsService);
    getFormDefinition(id: string): Promise<import("./product-specs.service").FormDefinition>;
    getBuilderStructure(id: string): Promise<{
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
                typeConfig: import("@prisma/client/runtime/library").JsonValue | null;
                possibleValues: import("@prisma/client/runtime/library").JsonValue | null;
                defaultValue: import("@prisma/client/runtime/library").JsonValue | null;
                placeholder: string | null;
                groupId: string | null;
                technicalKey: string;
                visibleToClient: boolean;
                visibleToProduction: boolean;
                editableAfterValidation: boolean;
                searchable: boolean;
                internalDescription: string | null;
                rules: import("@prisma/client/runtime/library").JsonValue | null;
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
            typeConfig: import("@prisma/client/runtime/library").JsonValue | null;
            possibleValues: import("@prisma/client/runtime/library").JsonValue | null;
            defaultValue: import("@prisma/client/runtime/library").JsonValue | null;
            placeholder: string | null;
            groupId: string | null;
            technicalKey: string;
            visibleToClient: boolean;
            visibleToProduction: boolean;
            editableAfterValidation: boolean;
            searchable: boolean;
            internalDescription: string | null;
            rules: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
    }>;
    createGroup(id: string, dto: CreateSpecGroupDto): Promise<{
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
    createSpecification(id: string, dto: CreateSpecificationDto): Promise<{
        type: import("@prisma/client").$Enums.SpecFieldType;
        required: boolean;
        id: string;
        name: string;
        unit: string | null;
        productId: string;
        order: number;
        helpText: string | null;
        typeConfig: import("@prisma/client/runtime/library").JsonValue | null;
        possibleValues: import("@prisma/client/runtime/library").JsonValue | null;
        defaultValue: import("@prisma/client/runtime/library").JsonValue | null;
        placeholder: string | null;
        groupId: string | null;
        technicalKey: string;
        visibleToClient: boolean;
        visibleToProduction: boolean;
        editableAfterValidation: boolean;
        searchable: boolean;
        internalDescription: string | null;
        rules: import("@prisma/client/runtime/library").JsonValue | null;
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
        typeConfig: import("@prisma/client/runtime/library").JsonValue | null;
        possibleValues: import("@prisma/client/runtime/library").JsonValue | null;
        defaultValue: import("@prisma/client/runtime/library").JsonValue | null;
        placeholder: string | null;
        groupId: string | null;
        technicalKey: string;
        visibleToClient: boolean;
        visibleToProduction: boolean;
        editableAfterValidation: boolean;
        searchable: boolean;
        internalDescription: string | null;
        rules: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    removeSpecification(specId: string): Promise<{
        id: string;
    }>;
    reorderSpecifications(id: string, dto: ReorderSpecificationsDto): Promise<import("./product-specs.service").FormDefinition>;
}
