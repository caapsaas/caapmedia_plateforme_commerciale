import { api } from '../api';
import { SecretariatTask, SecretariatTaskStatus } from '../../types';

/**
 * DTO pour la création ou la mise à jour d'une tâche du secrétariat.
 */
export interface SaveSecretariatTaskDto {
  id?: string;
  title: string;
  description: string;
  assignedToId: string; // employee ID
  dueDate: string; // Format YYYY-MM-DD
  status: SecretariatTaskStatus;
}

/**
 * Récupère toutes les tâches du secrétariat.
 */
export const getSecretariatTasks = async (): Promise<SecretariatTask[]> => {
  const { data } = await api.get<SecretariatTask[]>('/secretariat/tasks');
  return data;
};

/**
 * Crée ou met à jour une tâche.
 * @param taskData - Les données de la tâche.
 */
export const saveSecretariatTask = async (taskData: SaveSecretariatTaskDto): Promise<SecretariatTask> => {
  return taskData.id
    ? (await api.patch<SecretariatTask>(`/secretariat/tasks/${taskData.id}`, taskData)).data
    : (await api.post<SecretariatTask>('/secretariat/tasks', taskData)).data;
};

/**
 * Supprime une tâche par son ID.
 */
export const deleteSecretariatTask = async (id: string): Promise<void> => {
  await api.delete(`/secretariat/tasks/${id}`);
};
