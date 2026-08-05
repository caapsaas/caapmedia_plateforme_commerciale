import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useI18n } from '../../i18n';
import { useNotifications } from '../../hooks/useNotifications';
import { AppNotification } from '../../types';
import { getNotificationDisplay } from '../../utils/notificationDisplay';

const NotificationDropdown: React.FC = () => {
  const { t } = useI18n();

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
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-slate-200 transition-colors focus:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t('notifications.title')}
      >
        <Bell className="h-6 w-6 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-md shadow-lg py-1 z-30 border border-slate-100"
          role="menu"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
            <span className="font-semibold text-sm text-slate-700">{t('notifications.title')}</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs text-[#c6e911] font-medium hover:underline"
              >
                {t('notifications.markAllAsRead')}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">{t('notifications.noNotifications')}</p>
            ) : (
              notifications.map((notification) => {
                const { icon: TypeIcon, colorClass } = getNotificationDisplay(notification.type);
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                      notification.read ? 'opacity-60' : ''
                    }`}
                    role="menuitem"
                  >
                    <div className="flex items-start gap-2">
                      <span className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${colorClass}`}>
                        <TypeIcon className="h-4 w-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{notification.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-2">{notification.message}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{formatRelativeTime(notification.createdAt)}</p>
                      </div>
                      {!notification.read && (
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-[#c6e911] flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <Link
            to="/dashboard/notifications"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-center text-xs font-semibold text-slate-600 hover:bg-slate-50 border-t border-slate-100"
            role="menuitem"
          >
            {t('notifications.viewAll')}
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
