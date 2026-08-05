import { api } from '../api';
import { AppNotification } from '../../types';
import { PaginatedResponse, PaginationParams } from '../../types/pagination.types';

/**
 * Base URL de l'API (cookie httpOnly, meme origine que `api.ts`) - reprise ici
 * car `EventSource` ne peut pas reutiliser l'instance Axios (pas d'interceteur
 * possible sur ce type de connexion).
 */
const SSE_BASE_URL = 'http://localhost:3000/api-caapmedia';

export const getNotifications = async (
  params: PaginationParams & { unreadOnly?: boolean } = {},
): Promise<PaginatedResponse<AppNotification>> => {
  const { data } = await api.get<PaginatedResponse<AppNotification>>('/notifications', { params });
  return data;
};

export const getUnreadNotificationsCount = async (): Promise<{ count: number }> => {
  const { data } = await api.get<{ count: number }>('/notifications/unread-count');
  return data;
};

export const markNotificationAsRead = async (id: string): Promise<AppNotification> => {
  const { data } = await api.patch<AppNotification>(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsAsRead = async (): Promise<{ count: number }> => {
  const { data } = await api.patch<{ count: number }>('/notifications/read-all');
  return data;
};

export const getNotificationsSseUrl = (): string => `${SSE_BASE_URL}/notifications/sse`;
