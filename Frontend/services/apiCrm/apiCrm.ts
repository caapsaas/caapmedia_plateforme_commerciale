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
  const payload = { ...data };
 

  return data.id
    ? api.patch(`/crm/contacts/${data.id}`, payload).then(res => res.data)
    : api.post('/crm/contacts', payload).then(res => res.data);
};


export const deleteContact = (id: string): Promise<void> =>
  api.delete(`/crm/contacts/${id}`);

// --- LEADS ---
export const getLeads = (subsidiaryId: string): Promise<Lead[]> =>
  api.get(`/crm/leads?subsidiaryId=${subsidiaryId}`).then(res => res.data);

export const saveLead = (data: Omit<Lead, 'id' | 'subsidiaryId'> & { id?: string }): Promise<Lead> => {
  // Cloner les données pour éviter de modifier l'objet original
  const payload = { ...data };
  // Supprimer l'ID du payload pour la création afin d'éviter les erreurs de validation 400 (Bad Request)
  // car le DTO de création n'attend pas de propriété 'id'.
  if (!data.id) delete payload.id;
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
  // Cloner les données pour éviter de modifier l'objet original
  const payload = { ...data };
  // Supprimer l'ID du payload pour la création afin d'éviter les erreurs de validation 400 (Bad Request)
  // car le DTO de création n'attend pas de propriété 'id'.
  if (!data.id) delete payload.id;
  return data.id
    ? api.patch(`/crm/accounts/${data.id}`, payload).then(res => res.data)
    : api.post('/crm/accounts', payload).then(res => res.data);
};

export const deleteAccount = (id: string): Promise<void> =>
  api.delete(`/crm/accounts/${id}`);

// --- CONTRACTS ---
export const getContracts = (subsidiaryId: string): Promise<Contract[]> =>
  api.get(`/crm/contracts?subsidiaryId=${subsidiaryId}`).then(res => res.data);

export const saveContract = (data: Omit<Contract, 'id' | 'subsidiaryId'> & { id?: string }): Promise<Contract> => {
  // Cloner les données pour éviter de modifier l'objet original
  const payload = { ...data };
  // Supprimer l'ID du payload pour la création afin d'éviter les erreurs de validation 400 (Bad Request)
  // car le DTO de création n'attend pas de propriété 'id'.
  if (!data.id) delete payload.id;
  return data.id
    ? api.patch(`/crm/contracts/${data.id}`, payload).then(res => res.data)
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

export const saveOpportunity = (
  data: (Omit<Opportunity, 'id'> & { id?: string }) | (Partial<Opportunity> & { id: string }),
): Promise<Opportunity> => {
  const { id, ...payload } = data;
  // subsidiaryId est géré par le backend en fonction de l'utilisateur authentifié
  return data.id
    ? api.patch(`/crm/opportunities/${data.id}`, payload).then(res => res.data)
    : api.post('/crm/opportunities', payload).then(res => res.data);
};

export const updateOpportunityStage = ({ oppId, newStage }: { oppId: string; newStage: OpportunityStage }): Promise<Opportunity> =>
  api.patch(`/crm/opportunities/${oppId}`, { stage: newStage }).then(res => res.data);

export const winOpportunity = (opportunity: Opportunity): Promise<void> =>
  api.patch(`/crm/opportunities/${opportunity.id}`, { stage: 'WON' }).then(res => res.data);

// --- TASKS ---
export const getCrmTasks = (subsidiaryId: string): Promise<CrmTask[]> =>
  api.get(`/crm/tasks?subsidiaryId=${subsidiaryId}`).then(res => res.data);

export const saveTask = (data: Omit<CrmTask, 'id' | 'userId'> & { id?: string }): Promise<CrmTask> =>
  data.id
    ? api.patch(`/crm/tasks/${data.id}`, data).then(res => res.data)
    : api.post('/crm/tasks', data).then(res => res.data);

export const updateTaskStatus = ({ taskId, status }: { taskId: string; status: CrmTaskStatus }): Promise<CrmTask> =>
  api.patch(`/crm/tasks/${taskId}/status`, { status }).then(res => res.data);

// --- INTERACTIONS ---
export const getInteractions = (subsidiaryId: string): Promise<Interaction[]> =>
  api.get(`/crm/interactions?subsidiaryId=${subsidiaryId}`).then(res => res.data);

export const logInteraction = (data: Omit<Interaction, 'id' | 'date' | 'userId'>): Promise<Interaction> =>
  api.post('/crm/interactions', data).then(res => res.data);
