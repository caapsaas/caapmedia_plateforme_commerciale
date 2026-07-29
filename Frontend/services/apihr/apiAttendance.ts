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

/**
 * Payload pour le check-in / check-out via scan QR
 */
export interface CheckInPayload {
  qrToken: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  signature?: string;
}

/**
 * Réponse du endpoint check-in / check-out
 */
export interface CheckInResponse {
  success: boolean;
  type: 'check-in' | 'check-out';
  message: string;
  employeeName?: string;
  status: string;
  duration?: string;
  record: AttendanceRecord;
}

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
// Flux QR Code (check-in / check-out)
// ============================================================

/**
 * Effectue un check-in ou check-out via scan du QR code.
 * - Pas de JWT requis (le token QR contient les infos)
 * - Si pas de présence aujourd'hui → crée l'arrivée
 * - Si arrivée existe sans départ → enregistre le départ
 */
export const checkInWithQr = async (
  payload: CheckInPayload,
): Promise<CheckInResponse> => {
  const { data } = await api.post<CheckInResponse>(
    '/hr/attendance-checkin/check-in',
    payload,
  );
  return data;
};

/**
 * Check-out manuel (utilisateur connecté).
 */
export const checkOut = async (payload?: {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}): Promise<CheckInResponse> => {
  const { data } = await api.post<CheckInResponse>(
    '/hr/attendance-checkin/check-out',
    payload ?? {},
  );
  return data;
};

/**
 * Récupère le QR code du jour de l'employé connecté.
 */
export const getDailyQr = async () => {
  const { data } = await api.get('/hr/attendance-checkin/daily-qr');
  return data;
};

/**
 * Récupère tous les QR codes de la filiale (HR / Admin).
 */
export const getAllDailyQr = async () => {
  const { data } = await api.get('/hr/attendance-checkin/daily-qr-all');
  return data;
};

/**
 * Historique des présences de l'employé connecté.
 */
export const getAttendanceHistory = async (
  year?: number,
  month?: number,
): Promise<AttendanceRecord[]> => {
  const { data } = await api.get<AttendanceRecord[]>(
    '/hr/attendance-checkin/history',
    {
      params: { year, month },
    },
  );
  return data;
};

/**
 * Historique de toute la filiale (uniquement les scans QR).
 */
export const getAllAttendanceHistory = async (
  year?: number,
  month?: number,
): Promise<AttendanceRecord[]> => {
  const { data } = await api.get<AttendanceRecord[]>(
    '/hr/attendance-checkin/history-all',
    {
      params: { year, month },
    },
  );
  return data;
};

/**
 * Statistiques mensuelles de l'employé connecté.
 */
export const getAttendanceSummary = async () => {
  const { data } = await api.get('/hr/attendance-checkin/summary');
  return data;
};