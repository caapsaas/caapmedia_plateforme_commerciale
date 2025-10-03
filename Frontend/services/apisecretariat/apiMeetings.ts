import { api } from '../api';
import { Meeting } from '../../types';

/**
 * DTO pour la création ou la mise à jour d'une réunion.
 */
export interface SaveMeetingDto {
  id?: string;
  title: string;
  date: string; // Format YYYY-MM-DD
  time: string; // Format HH:mm
  location: string;
  participants: string[]; // Array of employee IDs
  agenda: string;
  minutes?: string;
}

/**
 * Récupère les réunions pour une période donnée.
 * @param fromDate - Date de début (YYYY-MM-DD).
 * @param toDate - Date de fin (YYYY-MM-DD).
 */
export const getMeetings = async (fromDate: string, toDate: string): Promise<Meeting[]> => {
  const { data } = await api.get<Meeting[]>('/secretariat/meetings', { params: { fromDate, toDate } });
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
 * Supprime (annule) une réunion par son ID.
 */
export const deleteMeeting = async (id: string): Promise<void> => {
  await api.delete(`/secretariat/meetings/${id}`);
};
