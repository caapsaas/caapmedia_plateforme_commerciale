import { api } from '../api';
import { AbsenceRecord, AbsenceType } from '../../types';

/**
 * DTO pour la création ou la mise à jour d'un enregistrement d'absence.
 */
export interface SaveAbsenceDto {
  id?: string;
  employeeId: string;
  type: AbsenceType;
  startDate: string; // Format YYYY-MM-DD
  endDate: string;   // Format YYYY-MM-DD
  reason: string;
  documentUrl?: string | null;
}

/**
 * Récupère les enregistrements d'absence pour une période donnée.
 * @param fromDate - Date de début (YYYY-MM-DD).
 * @param toDate - Date de fin (YYYY-MM-DD).
 */
export const getAbsenceRecords = async (fromDate: string, toDate: string): Promise<AbsenceRecord[]> => {
  const { data } = await api.get<AbsenceRecord[]>('/hr/absences', { params: { fromDate, toDate } });
  return data;
};

/**
 * Crée ou met à jour un enregistrement d'absence.
 * @param absenceData - Les données de l'absence.
 */
export const saveAbsenceRecord = async (absenceData: SaveAbsenceDto): Promise<AbsenceRecord> => {
  return absenceData.id
    ? (await api.patch<AbsenceRecord>(`/hr/absences/${absenceData.id}`, absenceData)).data
    : (await api.post<AbsenceRecord>('/hr/absences', absenceData)).data;
};

/**
 * Supprime un enregistrement d'absence par son ID.
 */
export const deleteAbsenceRecord = async (id: string): Promise<void> => {
  await api.delete(`/hr/absences/${id}`);
};
