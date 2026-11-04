import { getNeedRequestNotificationId } from '../utils/needRequestNotifications';
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
  const { isAuthenticated, user } = useAuth();
  const activeRole = user?.activeRole ?? user?.userRole;
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const notificationsQuery = useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, 'dropdown', user?.id, activeRole],
    queryFn: () => getNotifications({ limit: 20 }),
    enabled: isAuthenticated,
    refetchInterval: isConnected ? false : 30000,
  });

  const unreadCountQuery = useQuery({
    queryKey: [...UNREAD_COUNT_QUERY_KEY, user?.id, activeRole],
    queryFn: getUnreadNotificationsCount,
    enabled: isAuthenticated,
    refetchInterval: isConnected ? false : 30000,
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

    eventSource.onopen = () => {
      setIsConnected(true);
      void queryClient.invalidateQueries({ queryKey: ['need-requests'] });
      // Also retrieves notifications missed during a disconnect or role switch.
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      for (const key of ['orders', 'productionOrders', 'pendingValidationOrders', 'order-notification']) void queryClient.invalidateQueries({ queryKey: [key] });
    };
    eventSource.onerror = () => setIsConnected(false);

    eventSource.addEventListener('notification', (event: MessageEvent<string>) => {
      let notification: AppNotification;
      try { notification = JSON.parse(event.data) as AppNotification; } catch { return; }
      if (!notification || typeof notification !== 'object') return;
      if (notification.targetRole && notification.targetRole !== activeRole) return;
      if (notification.orderId) {
        for (const key of ['orders', 'productionOrders', 'pendingValidationOrders', 'order-notification']) void queryClient.invalidateQueries({ queryKey: [key] });
      }
      if (getNeedRequestNotificationId(notification)) void queryClient.invalidateQueries({ queryKey: ['need-requests'] });
      // Refresh dropdown, unread count and the paginated notification page.
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    });

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, user?.id, activeRole, queryClient]);

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
