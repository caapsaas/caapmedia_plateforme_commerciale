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
export const getAbsenceRecords = async (subsidiaryId?: string): Promise<AbsenceRecord[]> => {
  const { data } = await api.get<PaginatedResponse<AbsenceRecord>>('/hr/absence-records', { params: { subsidiaryId, limit: 500 } });
  return data.data;
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

export interface SubsidiaryHoliday {
  id: string;
  date: string;
  name: string;
  subsidiaryId: string;
}

export interface SubsidiaryCalendar {
  workingDays: number[];
  holidays: SubsidiaryHoliday[];
}

export const getSubsidiaryCalendar = async (subsidiaryId: string): Promise<SubsidiaryCalendar> => {
  const { data } = await api.get<SubsidiaryCalendar>('/hr/absence-records/calendar', { params: { subsidiaryId } });
  return data;
};

export const saveSubsidiaryWorkingDays = async (
  subsidiaryId: string,
  workingDays: number[],
): Promise<{ id: string; workingDays: number[] }> => {
  const { data } = await api.patch('/hr/absence-records/calendar/working-days', { workingDays }, { params: { subsidiaryId } });
  return data;
};

export const addSubsidiaryHoliday = async (
  subsidiaryId: string,
  holiday: { date: string; name: string },
): Promise<SubsidiaryHoliday> => {
  const { data } = await api.post('/hr/absence-records/calendar/holidays', holiday, { params: { subsidiaryId } });
  return data;
};

export const deleteSubsidiaryHoliday = async (
  subsidiaryId: string,
  holidayId: string,
): Promise<SubsidiaryHoliday> => {
  const { data } = await api.delete(`/hr/absence-records/calendar/holidays/${holidayId}`, { params: { subsidiaryId } });
  return data;
};

/**
 * Lance manuellement la génération des absences du jour
 * (employés sans présence → absence UNJUSTIFIED).
 * Protégé par rôle (ADMIN, SUPER_ADMIN).
 * Le cron backend s'exécute aussi automatiquement à 18h.
 */
export const generateDailyAbsences = async (subsidiaryId?: string): Promise<{
  success: boolean;
  message: string;
}> => {
  const { data } = await api.post<{ success: boolean; message: string }>(
    '/hr/absence-records/generate-daily',
    undefined,
    { params: { subsidiaryId } },
  );
  return data;
};
