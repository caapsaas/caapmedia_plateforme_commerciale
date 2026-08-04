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
import { PaginatedResponse, PaginationParams } from '../../types/pagination.types';

// --- CONTACTS ---

/**
 * Conservé pour les vues qui ont besoin de la liste complète des contacts en
 * mémoire (filtrage/cross-référencement multi-onglets dans Pages/Crm.tsx).
 * Limit élevée pour préserver le comportement "tout charger" existant tant
 * que ces vues n'ont pas été migrées vers une pagination serveur dédiée.
 */
export const getContacts = (subsidiaryId: string): Promise<Contact[]> =>
  api
    .get<PaginatedResponse<Contact>>('/crm/contacts', { params: { subsidiaryId, limit: 1000 } })
    .then(res => res.data.data);

/**
 * Version paginée pour les vues qui affichent la liste des contacts
 * page par page (table avec pagination, AsyncSelect).
 */
export const getContactsPaginated = (
  params: PaginationParams & { subsidiaryId?: string; salesRepId?: string },
): Promise<PaginatedResponse<Contact>> =>
  api.get<PaginatedResponse<Contact>>('/crm/contacts', { params }).then(res => res.data);

// A la creation, le backend genere un mot de passe temporaire pour le portail
// client et le renvoie dans la reponse (voir contacts.service.ts) - absent
// sur une mise a jour (PATCH), d'ou l'union avec Contact simple.
export const saveContact = (data: Omit<Contact, 'id' | 'subsidiaryId'> & { id?: string }): Promise<Contact & { tempPassword?: string; message?: string }> => {
  const payload = { ...data };

  return data.id
    ? api.patch(`/crm/contacts/${data.id}`, payload).then(res => res.data)
    : api.post('/crm/contacts', payload).then(res => res.data);
};


export const deleteContact = (id: string): Promise<void> =>
  api.delete(`/crm/contacts/${id}`);

// --- LEADS ---
/**
 * Conservé pour les vues qui ont besoin de la liste complète des leads en
 * mémoire (cross-référencement multi-onglets dans Pages/Crm.tsx, select dans
 * ProformasManagement.tsx). Limit élevée pour préserver le comportement
 * "tout charger" existant.
 */
export const getLeads = (subsidiaryId: string): Promise<Lead[]> =>
  api
    .get<PaginatedResponse<Lead>>('/crm/leads', { params: { subsidiaryId, limit: 1000 } })
    .then(res => res.data.data);

/**
 * Version paginée pour les vues qui affichent la liste des leads page par page.
 */
export const getLeadsPaginated = (
  params: PaginationParams & { subsidiaryId?: string; salesRepId?: string },
): Promise<PaginatedResponse<Lead>> =>
  api.get<PaginatedResponse<Lead>>('/crm/leads', { params }).then(res => res.data);

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
/**
 * Conservé pour les vues qui ont besoin de la liste complète des comptes en
 * mémoire (cross-référencement multi-onglets dans Pages/Crm.tsx). Limit
 * élevée pour préserver le comportement "tout charger" existant.
 */
export const getAccounts = (subsidiaryId: string): Promise<Account[]> =>
  api
    .get<PaginatedResponse<Account>>('/crm/accounts', { params: { subsidiaryId, limit: 1000 } })
    .then(res => res.data.data);

/**
 * Version paginée pour les vues qui affichent la liste des comptes page par page.
 */
export const getAccountsPaginated = (
  params: PaginationParams & { subsidiaryId?: string; salesRepId?: string },
): Promise<PaginatedResponse<Account>> =>
  api.get<PaginatedResponse<Account>>('/crm/accounts', { params }).then(res => res.data);

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
/**
 * Conservé pour les vues qui ont besoin de la liste complète des contrats en
 * mémoire (cross-référencement multi-onglets dans Pages/Crm.tsx). Limit
 * élevée pour préserver le comportement "tout charger" existant.
 */
export const getContracts = (subsidiaryId: string): Promise<Contract[]> =>
  api
    .get<PaginatedResponse<Contract>>('/crm/contracts', { params: { subsidiaryId, limit: 1000 } })
    .then(res => res.data.data);

/**
 * Version paginée pour les vues qui affichent la liste des contrats page par page.
 */
export const getContractsPaginated = (
  params: PaginationParams & { subsidiaryId?: string },
): Promise<PaginatedResponse<Contract>> =>
  api.get<PaginatedResponse<Contract>>('/crm/contracts', { params }).then(res => res.data);

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
/**
 * Conservé pour Pages/Crm.tsx (pipeline kanban — a besoin de toutes les
 * opportunités visibles simultanément, pas d'une pagination cliquable).
 */
export const getOpportunities = (subsidiaryId: string): Promise<Opportunity[]> =>
  api.get<PaginatedResponse<Opportunity>>('/crm/opportunities', { params: { subsidiaryId, limit: 500 } })
    .then(res => res.data.data)
    .catch(error => {
      throw error;
    });

export const getOpportunitiesPaginated = (
  params: PaginationParams & { subsidiaryId?: string },
): Promise<PaginatedResponse<Opportunity>> =>
  api.get<PaginatedResponse<Opportunity>>('/crm/opportunities', { params }).then(res => res.data);

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
  api.get<PaginatedResponse<CrmTask>>('/crm/tasks', { params: { subsidiaryId, limit: 500 } }).then(res => res.data.data);

export const getCrmTasksPaginated = (
  params: PaginationParams & { subsidiaryId?: string },
): Promise<PaginatedResponse<CrmTask>> =>
  api.get<PaginatedResponse<CrmTask>>('/crm/tasks', { params }).then(res => res.data);

export const saveTask = (data: Omit<CrmTask, 'id' | 'userId'> & { id?: string }): Promise<CrmTask> =>
  data.id
    ? api.patch(`/crm/tasks/${data.id}`, data).then(res => res.data)
    : api.post('/crm/tasks', data).then(res => res.data);

export const updateTaskStatus = ({ taskId, status }: { taskId: string; status: CrmTaskStatus }): Promise<CrmTask> =>
  api.patch(`/crm/tasks/${taskId}/status`, { status }).then(res => res.data);

// --- INTERACTIONS ---
export const getInteractions = (subsidiaryId: string): Promise<Interaction[]> =>
  api.get<PaginatedResponse<Interaction>>('/crm/interactions', { params: { subsidiaryId, limit: 500 } }).then(res => res.data.data);

export const getInteractionsPaginated = (
  params: PaginationParams & { subsidiaryId?: string },
): Promise<PaginatedResponse<Interaction>> =>
  api.get<PaginatedResponse<Interaction>>('/crm/interactions', { params }).then(res => res.data);

export const logInteraction = (data: Omit<Interaction, 'id' | 'date' | 'userId'>): Promise<Interaction> =>
  api.post('/crm/interactions', data).then(res => res.data);
