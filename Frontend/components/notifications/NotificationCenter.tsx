import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { getUserNotifications, markNotificationAsRead, getUnreadNotificationsCount, NotificationData } from '../../services/apiNotifications/apiNotifications';
import { UserRole } from '../../types/models';
import IconBell from '../icons/IconBell';
import IconX from '../icons/IconX';

const NotificationCenter: React.FC<{ hideButton?: boolean }> = ({ hideButton = false }) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Uniquement les administrateurs et directeurs financiers peuvent voir les notifications
  const canViewNotifications = user?.userRole === UserRole.ADMIN || user?.userRole === UserRole.FINANCIAL_DIRECTOR;

  useEffect(() => {
    if (!canViewNotifications) return;

    const loadNotifications = async () => {
      try {
        const [notificationsData, unreadCountData] = await Promise.all([
          getUserNotifications(),
          getUnreadNotificationsCount()
        ]);
        setNotifications(notificationsData);
        setUnreadCount(unreadCountData);
      } catch (error) {
        console.error('Error loading notifications:', error);
        toast('error', t('notifications.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Configurer un interval pour vérifier les nouvelles notifications
    const interval = setInterval(loadNotifications, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [canViewNotifications, toast, t]);

  // Si hideButton est true, ouvrir automatiquement les notifications
  useEffect(() => {
    if (hideButton && canViewNotifications) {
      setIsOpen(true);
    }
  }, [hideButton, canViewNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast('error', t('notifications.error.markAsRead'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.read).map(n => markNotificationAsRead(n.id))
      );
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast('error', t('notifications.error.markAllAsRead'));
    }
  };

  if (!canViewNotifications) {
    return null;
  }

  return (
    <div className="relative">
      {/* Bouton de notification - uniquement si hideButton est false */}
      {!hideButton && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
        >
          <IconBell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Panneau de notification - affiché si isOpen est true ou si hideButton est true */}
      {(isOpen || hideButton) && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* En-tête */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('notifications.title')}
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {t('notifications.markAllAsRead')}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <IconX className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                {t('common.loading')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {t('notifications.noNotifications')}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            notification.type === 'EXTERNAL_TRANSACTION_CREATED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {t(`notifications.types.${notification.type}`)}
                          </span>
                          {!notification.read && (
                            <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        {notification.createdAt && (
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="ml-3 p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title={t('notifications.markAsRead')}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10l-5 5" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
