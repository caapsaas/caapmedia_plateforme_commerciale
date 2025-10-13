import { api } from './api';
import { Contact, Lead, Account, Opportunity, Contract, Interaction, CrmTask, OpportunityStage, CrmTaskStatus } from '../types';

// Fonctions de lecture (Queries)
export const getContacts = async (): Promise<Contact[]> => {
    const { data } = await api.get('/contacts');
    return data;
};

export const getLeads = async (): Promise<Lead[]> => {
    const { data } = await api.get('/leads');
    return data;
};

export const getAccounts = async (): Promise<Account[]> => {
    const { data } = await api.get('/accounts');
    return data;
};

export const getOpportunities = async (): Promise<Opportunity[]> => {
    const { data } = await api.get('/opportunities');
    return data;
};

export const getContracts = async (): Promise<Contract[]> => {
    const { data } = await api.get('/contracts');
    return data;
};

export const getInteractions = async (): Promise<Interaction[]> => {
    const { data } = await api.get('/interactions');
    return data;
};

export const getCrmTasks = async (): Promise<CrmTask[]> => {
    const { data } = await api.get('/crm-tasks');
    return data;
};

// Fonctions d'écriture (Mutations)

/**
 * Crée ou met à jour une entité CRM générique.
 * Si l'objet data contient un 'id', une requête PATCH est effectuée, sinon une requête POST.
 */
export const createOrUpdateEntity = async <T extends { id?: string }>(entity: string, data: Partial<T>): Promise<T> => {
    if (data.id) {
        const { id, ...updateData } = data;
        const response = await api.patch<T>(`/${entity}/${id}`, updateData);
        return response.data;
    } else {
        const response = await api.post<T>(`/${entity}`, data);
        return response.data;
    }
};

/**
 * Supprime une entité CRM générique par son ID.
 */
export const deleteEntity = async (entity: string, id: string): Promise<void> => {
    await api.delete(`/${entity}/${id}`);
};

export const updateOpportunityStage = async (payload: { oppId: string; newStage: OpportunityStage }): Promise<Opportunity> => {
    const { data } = await api.patch<Opportunity>(`/opportunities/${payload.oppId}/stage`, { stage: payload.newStage });
    return data;
};

export const updateCrmTaskStatus = async (payload: { taskId: string; status: CrmTaskStatus }): Promise<CrmTask> => {
    const { data } = await api.patch<CrmTask>(`/crm-tasks/${payload.taskId}/status`, { status: payload.status });
    return data;
};

export const convertLead = async (leadId: string): Promise<{ account: Account, contact: Contact }> => {
    const { data } = await api.post(`/leads/${leadId}/convert`);
    return data;
};

export const winOpportunity = async (opportunity: Opportunity): Promise<void> => {
    await api.post(`/opportunities/${opportunity.id}/win`);
};
