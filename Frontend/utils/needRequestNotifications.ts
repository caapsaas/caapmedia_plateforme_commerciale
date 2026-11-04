import type { AppNotification } from '../types';

const events = new Set(['need.created', 'need.approved', 'need.rejected', 'need.paid']);

/** Shared by realtime refresh and both notification entry points. */
export function getNeedRequestNotificationId(notification: Pick<AppNotification, 'data'>): string | null {
  const data = notification.data;
  if (!data || typeof data.event !== 'string' || !events.has(data.event)) return null;
  return typeof data.requestId === 'string' && data.requestId.trim() ? data.requestId : null;
}
