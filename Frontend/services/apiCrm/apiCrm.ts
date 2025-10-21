import { api } from '../api'; // Assumons que vous avez un client api configuré
import { Contact, Opportunity, Interaction, CrmTask, Lead, Account, Contract, OpportunityStage, CrmTaskStatus } from '../../types';

// Fonctions de lecture (GET)
export const getContacts = (subsidiaryId: string): Promise<Contact[]> => api.get(`/crm/contacts?subsidiaryId=${subsidiaryId}`).then(res => res.data);
export const getOpportunities = (subsidiaryId: string): Promise<Opportunity[]> => api.get(`/crm/opportunities?subsidiaryId=${subsidiaryId}`).then(res => res.data);
export const getLeads = (subsidiaryId: string): Promise<Lead[]> => api.get(`/crm/leads?subsidiaryId=${subsidiaryId}`).then(res => res.data);
export const getAccounts = (subsidiaryId: string): Promise<Account[]> => api.get(`/crm/accounts?subsidiaryId=${subsidiaryId}`).then(res => res.data);
export const getContracts = (subsidiaryId: string): Promise<Contract[]> => api.get(`/crm/contracts?subsidiaryId=${subsidiaryId}`).then(res => res.data);
export const getCrmTasks = (subsidiaryId: string): Promise<CrmTask[]> => api.get(`/crm/tasks?subsidiaryId=${subsidiaryId}`).then(res => res.data);
export const getInteractions = (subsidiaryId: string): Promise<Interaction[]> => api.get(`/crm/interactions?subsidiaryId=${subsidiaryId}`).then(res => res.data);

// Fonctions de modification (Mutations)

// --- Contact ---
export const saveContact = (data: Omit<Contact, 'id' | 'subsidiaryId'> & { id?: string }): Promise<Contact> => {
    const payload = { ...data, subsidiaryId: undefined }; // subsidiaryId is handled by backend
    return data.id 
        ? api.put(`/crm/contacts/${data.id}`, payload).then(res => res.data) 
        : api.post('/crm/contacts', payload).then(res => res.data);
};
export const deleteContact = (id: string): Promise<void> => api.delete(`/crm/contacts/${id}`);

// --- Lead ---
export const saveLead = (data: Omit<Lead, 'id' | 'subsidiaryId'> & { id?: string }): Promise<Lead> => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        const value = (data as any)[key];
        if (value !== undefined && value !== null) {
            formData.append(key, value);
        }
    });

    return data.id
        ? api.put(`/crm/leads/${data.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => res.data)
        : api.post('/crm/leads', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => res.data);
};
export const deleteLead = (id: string): Promise<void> => api.delete(`/crm/leads/${id}`);
export const convertLead = (leadId: string): Promise<Contact> => api.post(`/crm/leads/${leadId}/convert`).then(res => res.data);

// --- Account ---
export const saveAccount = (data: Omit<Account, 'id' | 'subsidiaryId'> & { id?: string }): Promise<Account> => {
    const payload = { ...data, subsidiaryId: undefined };
    return data.id 
        ? api.put(`/crm/accounts/${data.id}`, payload).then(res => res.data) 
        : api.post('/crm/accounts', payload).then(res => res.data);
};
export const deleteAccount = (id: string): Promise<void> => api.delete(`/crm/accounts/${id}`);

// --- Contract ---
export const saveContract = (data: Omit<Contract, 'id' | 'subsidiaryId'> & { id?: string }): Promise<Contract> => {
    const payload = { ...data, subsidiaryId: undefined };
    return data.id 
        ? api.put(`/crm/contracts/${data.id}`, payload).then(res => res.data) 
        : api.post('/crm/contracts', payload).then(res => res.data);
};
export const deleteContract = (id: string): Promise<void> => api.delete(`/crm/contracts/${id}`);

// --- Opportunity ---
export const saveOpportunity = (data: Partial<Opportunity>): Promise<Opportunity> => {
    const payload = { ...data, subsidiaryId: undefined };
    return data.id 
        ? api.put(`/crm/opportunities/${data.id}`, payload).then(res => res.data) 
        : api.post('/crm/opportunities', payload).then(res => res.data);
};
export const updateOpportunityStage = ({ oppId, newStage }: { oppId: string, newStage: OpportunityStage }): Promise<Opportunity> => api.patch(`/crm/opportunities/${oppId}/stage`, { stage: newStage }).then(res => res.data);
export const winOpportunity = (opportunity: Opportunity): Promise<void> => api.post(`/crm/opportunities/${opportunity.id}/win`);

// --- Task ---
export const saveTask = (data: Omit<CrmTask, 'id' | 'userId'> & { id?: string }): Promise<CrmTask> => {
    return data.id 
        ? api.put(`/crm/tasks/${data.id}`, data).then(res => res.data) 
        : api.post('/crm/tasks', data).then(res => res.data);
};
export const updateTaskStatus = ({ taskId, status }: { taskId: string, status: CrmTaskStatus }): Promise<CrmTask> => api.patch(`/crm/tasks/${taskId}/status`, { status }).then(res => res.data);

// --- Interaction ---
export const logInteraction = (data: Omit<Interaction, 'id' | 'date' | 'userId'>): Promise<Interaction> => api.post('/crm/interactions', data).then(res => res.data);
