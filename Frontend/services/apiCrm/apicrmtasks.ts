import { api } from '../api';
import { CrmTask } from '../../types';

/**
 * Données nécessaires pour la création d'une tâche CRM.
 * 'id', 'userId', 'status', 'createdAt', 'updatedAt' sont gérés par le backend.
 */
export type CrmTaskCreationData = Omit<CrmTask, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>;

/**
 * Données pour la mise à jour d'une tâche CRM. Toutes les propriétés sont optionnelles.
 */
export type CrmTaskUpdateData = Partial<CrmTaskCreationData>;

/**
 * Crée une nouvelle tâche CRM.
 * La tâche est automatiquement assignée à l'utilisateur connecté.
 * @param taskData - Les données de la tâche à créer.
 * @returns La tâche nouvellement créée.
 */
export const createCrmTask = async (taskData: CrmTaskCreationData): Promise<CrmTask> => {
  const { data } = await api.post<CrmTask>('/crm/tasks', taskData);
  return data;
};

/**
 * Récupère la liste des tâches CRM.
 * La liste est filtrée par le backend en fonction du rôle de l'utilisateur :
 * - COMMERCIAL: ne voit que ses propres tâches.
 * - ADMIN: voit toutes les tâches de sa filiale.
 * @returns Un tableau de tâches CRM.
 */
export const getCrmTasks = async (): Promise<CrmTask[]> => {
  const { data } = await api.get<CrmTask[]>('/crm/tasks');
  return data;
};

/**
 * Récupère les détails d'une tâche CRM spécifique par son ID.
 * L'accès est restreint à la tâche si elle est assignée à l'utilisateur connecté.
 * @param id - L'ID de la tâche à récupérer.
 * @returns Les données de la tâche.
 */
export const getCrmTaskById = async (id: string): Promise<CrmTask> => {
  const { data } = await api.get<CrmTask>(`/crm/tasks/${id}`);
  return data;
};

/**
 * Met à jour une tâche CRM existante.
 * L'utilisateur doit être le propriétaire de la tâche.
 * @param id - L'ID de la tâche à mettre à jour.
 * @param updateData - Les champs de la tâche à mettre à jour.
 * @returns La tâche mise à jour.
 */
export const updateCrmTask = async (id: string, updateData: CrmTaskUpdateData): Promise<CrmTask> => {
  const { data } = await api.patch<CrmTask>(`/crm/tasks/${id}`, updateData);
  return data;
};

/**
 * Supprime une tâche CRM par son ID.
 * L'utilisateur doit être le propriétaire de la tâche.
 * @param id - L'ID de la tâche à supprimer.
 * @returns La tâche qui a été supprimée.
 */
export const deleteCrmTask = async (id: string): Promise<CrmTask> => {
  const { data } = await api.delete<CrmTask>(`/crm/tasks/${id}`);
  return data;
};