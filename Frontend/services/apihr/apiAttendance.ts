import { api } from '../api';
import { AttendanceRecord, AttendanceStatus } from '../../types';

/**
 * DTO pour enregistrer une nouvelle présence.
 */
export interface RecordAttendanceDto {
  employeeId: string;
  date: string; // Format YYYY-MM-DD
  status: AttendanceStatus;
  arrivalTime?: string; // Format HH:mm
  departureTime?: string; // Format HH:mm
  breakTime?: number; // En minutes
  signature?: string; // Données de la signature (ex: base64)
}

/**
 * Récupère les enregistrements de présence pour une période donnée.
 * @param fromDate - Date de début (YYYY-MM-DD).
 * @param toDate - Date de fin (YYYY-MM-DD).
 */
export const getAttendanceRecords = async (fromDate: string, toDate: string): Promise<AttendanceRecord[]> => {
  const { data } = await api.get<AttendanceRecord[]>('/hr/attendance', { params: { fromDate, toDate } });
  return data;
};

/**
 * Enregistre une nouvelle présence pour un employé.
 */
export const recordAttendance = async (attendanceData: RecordAttendanceDto): Promise<AttendanceRecord> => {
  const { data } = await api.post<AttendanceRecord>('/hr/attendance', attendanceData);
  return data;
};
