import { api } from '../api';
import {
  Contact,
  Opportunity,
  Interaction,
  CrmTask,
  Lead,
  Account,
  Contract,
  OpportunityStage,
  CrmTaskStatus,
} from '../../types';

// --- CONTACTS ---
export const getContacts = (subsidiaryId: string): Promise<Contact[]> =>
  api.get(`/crm/contacts?subsidiaryId=${subsidiaryId}`).then(res => res.data);

export const saveContact = (data: Omit<Contact, 'id' | 'subsidiaryId'> & { id?: string }): Promise<Contact> => {
  const payload = { ...data }; // subsidiaryId should be handled by the backend based on the authenticated user
  return data.id
    ? api.put(`/crm/contacts/${data.id}`, payload).then(res => res.data)
    : api.post('/crm/contacts', payload).then(res => res.data);
};

export const deleteContact = (id: string): Promise<void> =>
  api.delete(`/crm/contacts/${id}`);

// --- LEADS ---
export const getLeads = (subsidiaryId: string): Promise<Lead[]> =>
  api.get(`/crm/leads?subsidiaryId=${subsidiaryId}`).then(res => res.data);

export const saveLead = (data: Omit<Lead, 'id' | 'subsidiaryId'> & { id?: string }): Promise<Lead> => {
  const payload = { ...data };
  return data.id
    ? api.patch(`/crm/leads/${data.id}`, payload).then(res => res.data)
    : api.post('/crm/leads', payload).then(res => res.data);
};

export const deleteLead = (id: string): Promise<void> =>
  api.delete(`/crm/leads/${id}`);

export const convertLead = (leadId: string): Promise<Contact> =>
  api.post(`/crm/leads/${leadId}/convert`).then(res => res.data);

// --- ACCOUNTS ---
export const getAccounts = (subsidiaryId: string): Promise<Account[]> =>
  api.get(`/crm/accounts?subsidiaryId=${subsidiaryId}`).then(res => res.data);

export const saveAccount = (data: Omit<Account, 'id' | 'subsidiaryId'> & { id?: string }): Promise<Account> => {
  const payload = { ...data }; // subsidiaryId should be handled by the backend based on the authenticated user
  return data.id
    ? api.put(`/crm/accounts/${data.id}`, payload).then(res => res.data)
    : api.post('/crm/accounts', payload).then(res => res.data);
};

export const deleteAccount = (id: string): Promise<void> =>
  api.delete(`/crm/accounts/${id}`);

// --- CONTRACTS ---
export const getContracts = (subsidiaryId: string): Promise<Contract[]> =>
  api.get(`/crm/contracts?subsidiaryId=${subsidiaryId}`).then(res => res.data);

export const saveContract = (data: Omit<Contract, 'id' | 'subsidiaryId'> & { id?: string }): Promise<Contract> => {
  const payload = { ...data }; // subsidiaryId should be handled by the backend based on the authenticated user
  return data.id
    ? api.put(`/crm/contracts/${data.id}`, payload).then(res => res.data)
    : api.post('/crm/contracts', payload).then(res => res.data);
};

export const deleteContract = (id: string): Promise<void> =>
  api.delete(`/crm/contracts/${id}`);

// --- OPPORTUNITIES ---
export const getOpportunities = (subsidiaryId: string): Promise<Opportunity[]> =>
  api.get(`/crm/opportunities?subsidiaryId=${subsidiaryId}`)
    .then(res => res.data)
    .catch(error => {
      throw error;
    });

export const saveOpportunity = (data: Partial<Opportunity>): Promise<Opportunity> => {
  const payload = { ...data }; // subsidiaryId should be handled by the backend based on the authenticated user
  return data.id
    ? api.put(`/crm/opportunities/${data.id}`, payload).then(res => res.data)
    : api.post('/crm/opportunities', payload).then(res => res.data);
};

export const updateOpportunityStage = ({ oppId, newStage }: { oppId: string; newStage: OpportunityStage }): Promise<Opportunity> =>
  api.patch(`/crm/opportunities/${oppId}/stage`, { stage: newStage }).then(res => res.data);

export const winOpportunity = (opportunity: Opportunity): Promise<void> =>
  api.post(`/crm/opportunities/${opportunity.id}/win`);

// --- TASKS ---
export const getCrmTasks = (subsidiaryId: string): Promise<CrmTask[]> =>
  api.get(`/crm/tasks?subsidiaryId=${subsidiaryId}`).then(res => res.data);

export const saveTask = (data: Omit<CrmTask, 'id' | 'userId'> & { id?: string }): Promise<CrmTask> =>
  data.id
    ? api.put(`/crm/tasks/${data.id}`, data).then(res => res.data)
    : api.post('/crm/tasks', data).then(res => res.data);

export const updateTaskStatus = ({ taskId, status }: { taskId: string; status: CrmTaskStatus }): Promise<CrmTask> =>
  api.patch(`/crm/tasks/${taskId}/status`, { status }).then(res => res.data);

// --- INTERACTIONS ---
export const getInteractions = (subsidiaryId: string): Promise<Interaction[]> =>
  api.get(`/crm/interactions?subsidiaryId=${subsidiaryId}`).then(res => res.data);

export const logInteraction = (data: Omit<Interaction, 'id' | 'date' | 'userId'>): Promise<Interaction> =>
  api.post('/crm/interactions', data).then(res => res.data);
