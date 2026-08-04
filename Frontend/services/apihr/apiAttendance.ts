import { api } from '../api';
import { AttendanceRecord } from '../../types';

/**
 * Données pour la création manuelle d'un enregistrement de présence.
 * employeeId est obligatoire en création manuelle.
 */
export type AttendanceRecordCreationData = Omit<
  AttendanceRecord,
  'id' | 'subsidiaryId' | 'createdAt' | 'updatedAt'
> & {
  employeeId: string;
};

/**
 * Données pour la mise à jour d'un enregistrement de présence.
 */
export type AttendanceRecordUpdateData = Partial<AttendanceRecordCreationData>;

// ============================================================
// CRUD manuel (HR / Admin)
// ============================================================

/**
 * Récupère tous les enregistrements de présence de la filiale.
 */
export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  const { data } = await api.get<AttendanceRecord[]>('/hr/attendance-records');
  return data;
};

/**
 * Crée ou met à jour un enregistrement de présence (manuel).
 */
export const saveAttendanceRecord = async (
  attendanceData: Partial<AttendanceRecord> & { employeeId?: string },
): Promise<AttendanceRecord> => {
  if (attendanceData.id) {
    const { data } = await api.patch<AttendanceRecord>(
      `/hr/attendance-records/${attendanceData.id}`,
      attendanceData,
    );
    return data;
  }

  // Création manuelle → employeeId obligatoire
  if (!attendanceData.employeeId) {
    throw new Error('employeeId is required for manual creation');
  }

  const { data } = await api.post<AttendanceRecord>(
    '/hr/attendance-records',
    attendanceData,
  );
  return data;
};

/**
 * Supprime un enregistrement de présence.
 */
export const deleteAttendanceRecord = async (
  id: string,
): Promise<AttendanceRecord> => {
  const { data } = await api.delete<AttendanceRecord>(
    `/hr/attendance-records/${id}`,
  );
  return data;
};

// ============================================================
// Nouveau flux QR Code dynamique (tokens courts)
// ============================================================

/**
 * Récupère le token dynamique actif pour la filiale.
 */
export const getCurrentDynamicToken = async () => {
  const { data } = await api.get('/hr/dynamic-token/current');
  return data;
};

/**
 * Génère un nouveau token dynamique.
 */
export const generateDynamicToken = async () => {
  const { data } = await api.get('/hr/dynamic-token/generate');
  return data;
};

/**
 * Effectue un pointage via le nouveau système (matricule + PIN + géoloc).
 */
export const pointage = async (payload: {
  token: string;
  matricule: string;
  pinCode: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}) => {
  const { data } = await api.post('/pointage', payload);
  return data;
};