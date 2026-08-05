import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getNotificationsSseUrl,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/apiCommon/apiNotifications';
import { AppNotification } from '../types';
import { useAuth } from '../context/AuthContext';

const NOTIFICATIONS_QUERY_KEY = ['notifications'];
const UNREAD_COUNT_QUERY_KEY = ['notifications', 'unread-count'];

/**
 * Flux temps réel des notifications : requête initiale via React Query, puis
 * mise à jour poussée par SSE (`EventSource`, cookie httpOnly envoyé
 * automatiquement grâce à `withCredentials`) — pas de polling.
 */
export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const notificationsQuery = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => getNotifications({ limit: 20 }),
    enabled: isAuthenticated,
  });

  const unreadCountQuery = useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: getUnreadNotificationsCount,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      return;
    }

    const eventSource = new EventSource(getNotificationsSseUrl(), { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => setIsConnected(true);
    eventSource.onerror = () => setIsConnected(false);

    eventSource.addEventListener('notification', (event: MessageEvent<string>) => {
      const notification = JSON.parse(event.data) as AppNotification;
      queryClient.setQueryData<{ data: AppNotification[] } | undefined>(
        NOTIFICATIONS_QUERY_KEY,
        (current) =>
          current ? { ...current, data: [notification, ...current.data] } : current,
      );
      queryClient.setQueryData<{ count: number } | undefined>(UNREAD_COUNT_QUERY_KEY, (current) => ({
        count: (current?.count ?? 0) + 1,
      }));
    });

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, queryClient]);

  const markAsRead = useCallback(
    async (id: string) => {
      await markNotificationAsRead(id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY }),
      ]);
    },
    [queryClient],
  );

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsAsRead();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY }),
    ]);
  }, [queryClient]);

  return {
    notifications: notificationsQuery.data?.data ?? [],
    unreadCount: unreadCountQuery.data?.count ?? 0,
    isLoading: notificationsQuery.isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
  };
}
