import { api } from '../api';
import { AbsenceRecord } from '../../types';

/**
 * Données pour la création d'un enregistrement d'absence.
 * Les champs gérés par le backend sont omis.
 */
export type AbsenceRecordCreationData = Omit<AbsenceRecord, 'id' | 'subsidiaryId' | 'createdAt' | 'updatedAt'>;

/**
 * Données pour la mise à jour d'un enregistrement d'absence.
 */
export type AbsenceRecordUpdateData = Partial<AbsenceRecordCreationData>;

/**
 * Récupère tous les enregistrements d'absence pour la filiale de l'utilisateur connecté.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 */
export const getAbsenceRecords = async (): Promise<AbsenceRecord[]> => {
  const { data } = await api.get<AbsenceRecord[]>('/hr/absence-records');
  return data;
};

/**
 * Crée ou met à jour un enregistrement d'absence.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 * @param absenceData - Les données de l'absence.
 */
export const saveAbsenceRecord = async (absenceData: Partial<AbsenceRecord>): Promise<AbsenceRecord> => {
  return absenceData.id
    ? (await api.patch<AbsenceRecord>(`/hr/absence-records/${absenceData.id}`, absenceData)).data
    : (await api.post<AbsenceRecord>('/hr/absence-records', absenceData)).data;
};

/**
 * Supprime un enregistrement d'absence par son ID.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 */
export const deleteAbsenceRecord = async (id: string): Promise<AbsenceRecord> => {
  const { data } = await api.delete<AbsenceRecord>(`/hr/absence-records/${id}`);
  return data;
};
