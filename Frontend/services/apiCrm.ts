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
// Note: Les fonctions de sauvegarde/suppression seront appelées directement dans les mutations
// pour plus de clarté, mais pourraient aussi être définies ici.

export const updateOpportunityStage = (payload: { oppId: string; newStage: OpportunityStage }) => 
    api.patch(`/opportunities/${payload.oppId}/stage`, { stage: payload.newStage });

export const updateCrmTaskStatus = (payload: { taskId: string; status: CrmTaskStatus }) =>
    api.patch(`/crm-tasks/${payload.taskId}/status`, { status: payload.status });
