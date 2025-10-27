import { api } from '../api';
import { CompanyDocument, Meeting, SecretariatTask, DocumentCategory, DocumentStatus, SecretariatTaskStatus } from '../../types';

// --- Types ---

// Renommé 'name' en 'documentName' pour correspondre au DTO du backend.
// Supprimé 'fileUrl' car il est généré par le backend.
export type CompanyDocumentCreationData = Omit<CompanyDocument, 'id' | 'uploadDate' | 'fileUrl' | 'name'> 
  & { documentName: string; }; // file is now passed separately in FormData

export type CompanyDocumentUpdateData = Partial<Omit<CompanyDocument, 'id' | 'uploadDate' | 'subsidiaryId'>> & { file?: File };
export interface CompanyDocumentSearchQuery {
  documentName?: string;
  category?: DocumentCategory;
  status?: DocumentStatus;
}

export type MeetingCreationData = Omit<Meeting, 'id' | 'participants'> & { participantIds?: string[] };
export type MeetingUpdateData = Partial<MeetingCreationData>;
export type SaveMeetingDto = Partial<Meeting> & { participantIds?: string[] };
export interface MeetingSearchQuery {
  title?: string;
  meetingDate?: string; // YYYY-MM-DD
}

export type SecretariatTaskCreationData = Omit<SecretariatTask, 'id'>;
export type SecretariatTaskUpdateData = Partial<SecretariatTaskCreationData>;
export type SaveSecretariatTaskDto = Partial<SecretariatTask>;
export interface SecretariatTaskSearchQuery {
  title?: string;
  status?: SecretariatTaskStatus;
  dueDate?: string; // YYYY-MM-DD
}

// --- Company Documents ---

/**
 * Récupère tous les documents de l'entreprise.
 * Protégé par rôle (SECRETARY, ADMIN).
 */
export const getCompanyDocuments = async (): Promise<CompanyDocument[]> => {
  const { data } = await api.get<CompanyDocument[]>('/secretariat/documents');
  return data;
};

/**
 * Recherche des documents d'entreprise selon des critères.
 * @param query - Les critères de recherche.
 */
export const searchCompanyDocuments = async (query: CompanyDocumentSearchQuery): Promise<CompanyDocument[]> => {
  const { data } = await api.get<CompanyDocument[]>('/secretariat/documents/search', { params: query });
  return data;
};

/**
 * Crée un nouveau document d'entreprise avec un fichier.
 * @param documentData - Les données du document et le fichier.
 */
export const createCompanyDocument = async (documentData: FormData): Promise<CompanyDocument> => {
  const { data } = await api.post<CompanyDocument>('/secretariat/documents', documentData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

/**
 * Met à jour un document d'entreprise.
 * @param id - L'ID du document.
 * @param updateData - Les données à mettre à jour (peut inclure un nouveau fichier).
 */
export const updateCompanyDocument = async (id: string, updateData: FormData): Promise<CompanyDocument> => {
  const { data } = await api.patch<CompanyDocument>(`/secretariat/documents/${id}`, updateData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

/**
 * Supprime un document d'entreprise.
 */
export const deleteCompanyDocument = async (id: string): Promise<{ message: string }> => {
  const { data } = await api.delete<{ message: string }>(`/secretariat/documents/${id}`);
  return data;
};

// --- Meetings ---

/**
 * Récupère toutes les réunions.
 */
export const getMeetings = async (): Promise<Meeting[]> => {
  const { data } = await api.get<Meeting[]>('/secretariat/meetings');
  return data;
};

/**
 * Recherche des réunions.
 * @param query - Les critères de recherche.
 */
export const searchMeetings = async (query: MeetingSearchQuery): Promise<Meeting[]> => {
  const { data } = await api.get<Meeting[]>('/secretariat/meetings/search', { params: query });
  return data;
};

/**
 * Crée ou met à jour une réunion.
 * @param meetingData - Les données de la réunion.
 */
export const saveMeeting = async (meetingData: SaveMeetingDto): Promise<Meeting> => {
  return meetingData.id
    ? (await api.patch<Meeting>(`/secretariat/meetings/${meetingData.id}`, meetingData)).data
    : (await api.post<Meeting>('/secretariat/meetings', meetingData)).data;
};

/**
 * Supprime une réunion.
 */
export const deleteMeeting = async (id: string): Promise<{ message: string }> => {
  const { data } = await api.delete<{ message: string }>(`/secretariat/meetings/${id}`);
  return data;
};

// --- Secretariat Tasks ---

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
export const deleteSecretariatTask = async (id: string): Promise<{ message: string }> => {
  const { data } = await api.delete<{ message: string }>(`/secretariat/tasks/${id}`);
  return data;
};
