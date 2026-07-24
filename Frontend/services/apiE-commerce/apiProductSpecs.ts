import { api } from '../api';
import { FormDefinition, ProductSpecGroup, ProductSpecification, SpecFieldType } from '../../types/models';

// --- Groupes de spécifications ---

export interface CreateSpecGroupData {
    name: string;
    order?: number;
}

export interface BuilderStructure {
    groups: ProductSpecGroup[];
    ungroupedSpecifications: ProductSpecification[];
}

// Structure brute (non résolue) pour l'édition dans le Builder — à la différence
// de getFormDefinition, les possibleValues basées sur un référentiel restent
// sous la forme { referenceListKey } plutôt que résolues en options.
export const getBuilderStructure = async (productId: string): Promise<BuilderStructure> => {
    const { data } = await api.get(`/products/${productId}/spec-structure`);
    return data;
};

export const createSpecGroup = async (productId: string, groupData: CreateSpecGroupData): Promise<ProductSpecGroup> => {
    const { data } = await api.post(`/products/${productId}/spec-groups`, groupData);
    return data;
};

export const updateSpecGroup = async (groupId: string, groupData: Partial<CreateSpecGroupData>): Promise<ProductSpecGroup> => {
    const { data } = await api.patch(`/products/spec-groups/${groupId}`, groupData);
    return data;
};

export const deleteSpecGroup = async (groupId: string): Promise<{ id: string }> => {
    const { data } = await api.delete(`/products/spec-groups/${groupId}`);
    return data;
};

// --- Spécifications ---

export interface SpecificationFormData {
    groupId?: string | null;
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

export const createSpecification = async (productId: string, specData: SpecificationFormData): Promise<ProductSpecification> => {
    const { data } = await api.post(`/products/${productId}/specifications`, specData);
    return data;
};

export const updateSpecification = async (specId: string, specData: Partial<SpecificationFormData>): Promise<ProductSpecification> => {
    const { data } = await api.patch(`/products/specifications/${specId}`, specData);
    return data;
};

export const deleteSpecification = async (specId: string): Promise<{ id: string }> => {
    const { data } = await api.delete(`/products/specifications/${specId}`);
    return data;
};

export interface ReorderSpecItem {
    id: string;
    order: number;
    groupId?: string | null;
}

export const reorderSpecifications = async (productId: string, items: ReorderSpecItem[]): Promise<FormDefinition> => {
    const { data } = await api.patch(`/products/${productId}/specifications/reorder`, { items });
    return data;
};

// --- Définition du formulaire (lecture, utilisée à la création de commande) ---

export const getFormDefinition = async (productId: string): Promise<FormDefinition> => {
    const { data } = await api.get(`/products/${productId}/form-definition`);
    return data;
};
