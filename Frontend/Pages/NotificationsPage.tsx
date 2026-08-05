import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck } from 'lucide-react';
import { useI18n } from '../i18n';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/apiCommon/apiNotifications';
import { AppNotification } from '../types';
import { getNotificationDisplay } from '../utils/notificationDisplay';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/ui/EmptyState';

type NotificationFilter = 'all' | 'unread';
const PAGE_SIZE = 15;

// Page autonome "Notifications" — vue complète paginée en complément du
// dropdown compact du Header (voir NotificationDropdown.tsx), même pattern
// que gmo (groupe "Outils" du sidebar).
const NotificationsPage: React.FC = () => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'page', filter, page],
    queryFn: () => getNotifications({ page, limit: PAGE_SIZE, unreadOnly: filter === 'unread' }),
  });

  const notifications = data?.data ?? [];
  const meta = data?.meta ?? { page, limit: PAGE_SIZE, total: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false };

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ]);

  const handleMarkAsRead = async (notification: AppNotification) => {
    if (notification.read) return;
    await markNotificationAsRead(notification.id);
    await invalidate();
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    await invalidate();
  };

  const formatRelativeTime = (isoDate: string): string => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return t('notifications.timeAgo.now');
    if (diffMinutes < 60) return t('notifications.timeAgo.minutes', { count: diffMinutes });
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return t('notifications.timeAgo.hours', { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    return t('notifications.timeAgo.days', { count: diffDays });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">{t('notifications.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('notifications.subtitle')}</p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          disabled={notifications.every((n) => n.read) && meta.total === 0}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCheck className="h-4 w-4" />
          {t('notifications.markAllAsRead')}
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex space-x-2 p-1 bg-slate-100 rounded-lg w-fit mb-4">
          <button
            onClick={() => { setFilter('all'); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'all' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('notifications.filters.all')}
          </button>
          <button
            onClick={() => { setFilter('unread'); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'unread' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('notifications.filters.unread')}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="inbox"
            title={filter === 'unread' ? t('notifications.emptyUnreadTitle') : t('notifications.noNotifications')}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const { icon: TypeIcon, colorClass } = getNotificationDisplay(notification.type);
              return (
                <button
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification)}
                  className={`w-full text-left flex items-start gap-3 py-4 px-2 hover:bg-slate-50 rounded-lg transition-colors ${
                    notification.read ? 'opacity-60' : ''
                  }`}
                >
                  <span className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${colorClass}`}>
                    <TypeIcon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{notification.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(notification.createdAt)}</p>
                  </div>
                  {!notification.read && (
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#c6e911] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {meta.total > 0 && <Pagination meta={meta} onPageChange={setPage} />}
      </div>
    </div>
  );
};

export default NotificationsPage;
