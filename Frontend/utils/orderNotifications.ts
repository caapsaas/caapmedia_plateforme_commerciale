import { AppNotification, UserRole } from '../types';

export function getOrderNotificationTarget(notification: Pick<AppNotification, 'orderId' | 'data' | 'targetRole'>, role?: UserRole) {
  const id = notification.orderId;
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,160}$/.test(id)) return null;
  const event = notification.data?.event;
  if (typeof event !== 'string' || !event.startsWith('order.')) return null;
  const recipientRole = notification.targetRole || role;
  const production = recipientRole === UserRole.PRODUCTION_DIRECTOR ||
    ((recipientRole === UserRole.ADMIN || recipientRole === UserRole.SUPER_ADMIN) && event !== 'order.payment');
  return { to: production ? '/dashboard/production' as const : '/dashboard/sales' as const, hash: id };
}
