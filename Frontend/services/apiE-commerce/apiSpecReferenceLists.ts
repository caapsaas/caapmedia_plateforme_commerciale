import { api } from '../api';
import { SpecReferenceList } from '../../types/models';

const BASE_URL = '/spec-reference-lists';

export interface ReferenceListFormData {
    key: string;
    name: string;
}

export interface ReferenceValueFormData {
    value: string;
    label: string;
    order?: number;
}

export const getReferenceLists = async (): Promise<SpecReferenceList[]> => {
    const { data } = await api.get(BASE_URL);
    return data;
};

export const getReferenceList = async (id: string): Promise<SpecReferenceList> => {
    const { data } = await api.get(`${BASE_URL}/${id}`);
    return data;
};

export const createReferenceList = async (listData: ReferenceListFormData): Promise<SpecReferenceList> => {
    const { data } = await api.post(BASE_URL, listData);
    return data;
};

export const updateReferenceList = async (id: string, listData: Partial<ReferenceListFormData>): Promise<SpecReferenceList> => {
    const { data } = await api.patch(`${BASE_URL}/${id}`, listData);
    return data;
};

export const deleteReferenceList = async (id: string): Promise<{ id: string }> => {
    const { data } = await api.delete(`${BASE_URL}/${id}`);
    return data;
};

export const addReferenceValue = async (listId: string, valueData: ReferenceValueFormData) => {
    const { data } = await api.post(`${BASE_URL}/${listId}/values`, valueData);
    return data;
};

export const updateReferenceValue = async (valueId: string, valueData: Partial<ReferenceValueFormData>) => {
    const { data } = await api.patch(`${BASE_URL}/values/${valueId}`, valueData);
    return data;
};

export const deleteReferenceValue = async (valueId: string): Promise<{ id: string }> => {
    const { data } = await api.delete(`${BASE_URL}/values/${valueId}`);
    return data;
};
