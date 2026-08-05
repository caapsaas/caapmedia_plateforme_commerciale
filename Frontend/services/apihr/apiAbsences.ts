import { api } from '../api';
import { AbsenceRecord } from '../../types';
import { PaginatedResponse, PaginationParams } from '../../types/pagination.types';

/**
 * Données pour la création d'un enregistrement d'absence.
 * Les champs gérés par le backend sont omis.
 */
export type AbsenceRecordCreationData = Omit<
  AbsenceRecord,
  'id' | 'subsidiaryId' | 'createdAt' | 'updatedAt'
> & {
  employeeId: string;
};

/**
 * Données pour la mise à jour d'un enregistrement d'absence.
 */
export type AbsenceRecordUpdateData = Partial<AbsenceRecordCreationData>;

/**
 * Récupère tous les enregistrements d'absence de la filiale.
 * Protégé par rôle (HR_MANAGER, ADMIN, SUPER_ADMIN).
 */
export const getAbsenceRecords = async (): Promise<AbsenceRecord[]> => {
  const { data } = await api.get<AbsenceRecord[]>('/hr/absence-records');
  return data;
};

/**
 * Version paginée/recherchable (page/limit/search).
 */
export const getAbsenceRecordsPaginated = async (
  params: PaginationParams,
): Promise<PaginatedResponse<AbsenceRecord>> => {
  const { data } = await api.get<PaginatedResponse<AbsenceRecord>>('/hr/absence-records', { params });
  return data;
};

/**
 * Crée ou met à jour un enregistrement d'absence.
 * Protégé par rôle (HR_MANAGER, ADMIN, SUPER_ADMIN).
 */
export const saveAbsenceRecord = async (
  absenceData: Partial<AbsenceRecord> & { employeeId?: string },
): Promise<AbsenceRecord> => {
  if (absenceData.id) {
    const { data } = await api.patch<AbsenceRecord>(
      `/hr/absence-records/${absenceData.id}`,
      absenceData,
    );
    return data;
  }

  if (!absenceData.employeeId) {
    throw new Error('employeeId is required for manual creation');
  }

  const { data } = await api.post<AbsenceRecord>(
    '/hr/absence-records',
    absenceData,
  );
  return data;
};

/**
 * Supprime un enregistrement d'absence par son ID.
 * Protégé par rôle (HR_MANAGER, ADMIN, SUPER_ADMIN).
 */
export const deleteAbsenceRecord = async (
  id: string,
): Promise<AbsenceRecord> => {
  const { data } = await api.delete<AbsenceRecord>(
    `/hr/absence-records/${id}`,
  );
  return data;
};

/**
 * Lance manuellement la génération des absences du jour
 * (employés sans présence → absence UNJUSTIFIED).
 * Protégé par rôle (ADMIN, SUPER_ADMIN).
 * Le cron backend s'exécute aussi automatiquement à 18h.
 */
export const generateDailyAbsences = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  const { data } = await api.post<{ success: boolean; message: string }>(
    '/hr/absence-records/generate-daily',
  );
  return data;
};