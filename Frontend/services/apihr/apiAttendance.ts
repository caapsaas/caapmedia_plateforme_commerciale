import { api } from '../api';
import { AttendanceRecord } from '../../types';

/**
 * Données pour la création d'un enregistrement de présence.
 * Les champs gérés par le backend sont omis.
 */
export type AttendanceRecordCreationData = Omit<AttendanceRecord, 'id' | 'subsidiaryId' | 'createdAt' | 'updatedAt'>;

/**
 * Données pour la mise à jour d'un enregistrement de présence.
 */
export type AttendanceRecordUpdateData = Partial<AttendanceRecordCreationData>;

/**
 * Récupère tous les enregistrements de présence pour la filiale de l'utilisateur connecté.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 */
export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  const { data } = await api.get<AttendanceRecord[]>('/hr/attendance-records');
  return data;
};

/**
 * Crée ou met à jour un enregistrement de présence.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 * @param attendanceData - Les données de la présence.
 */
export const saveAttendanceRecord = async (attendanceData: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
  return attendanceData.id
    ? (await api.patch<AttendanceRecord>(`/hr/attendance-records/${attendanceData.id}`, attendanceData)).data
    : (await api.post<AttendanceRecord>('/hr/attendance-records', attendanceData)).data;
};

/**
 * Supprime un enregistrement de présence par son ID.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 */
export const deleteAttendanceRecord = async (id: string): Promise<AttendanceRecord> => {
  const { data } = await api.delete<AttendanceRecord>(`/hr/attendance-records/${id}`);
  return data;
};
