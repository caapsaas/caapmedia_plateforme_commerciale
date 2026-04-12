import { NotificationType, RecipientType } from '@prisma/client';

export { NotificationType, RecipientType };

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read?: boolean;
  createdAt?: string;
  orderId?: string;
  recipientId?: string;
  recipientType?: RecipientType;
}

export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  recipientId: string;
  recipientType: RecipientType;
  orderId?: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export interface NotificationFilters {
  type?: NotificationType;
  read?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  filters?: NotificationFilters;
}
