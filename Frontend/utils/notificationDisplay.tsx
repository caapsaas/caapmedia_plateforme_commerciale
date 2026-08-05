import React from 'react';
import {
  ShoppingCart,
  Package,
  CreditCard,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Landmark,
  KeyRound,
  Bell,
  LucideIcon,
} from 'lucide-react';
import { NotificationType } from '../types';

/**
 * Icône + couleur par type de notification (lucide-react, demandé
 * explicitement par l'utilisateur pour tout ce qui touche aux
 * notifications) — même principe que gmo, un type non couvert retombe sur
 * la cloche générique plutôt que de planter.
 */
const NOTIFICATION_DISPLAY: Record<NotificationType, { icon: LucideIcon; colorClass: string }> = {
  [NotificationType.NEW_ORDER]: { icon: ShoppingCart, colorClass: 'text-orange-600 bg-orange-100' },
  [NotificationType.ORDER_STATUS]: { icon: Package, colorClass: 'text-blue-600 bg-blue-100' },
  [NotificationType.PAYMENT_RECEIVED]: { icon: CreditCard, colorClass: 'text-emerald-600 bg-emerald-100' },
  [NotificationType.LOW_STOCK]: { icon: AlertTriangle, colorClass: 'text-amber-600 bg-amber-100' },
  [NotificationType.SYSTEM_ALERT]: { icon: AlertCircle, colorClass: 'text-red-600 bg-red-100' },
  [NotificationType.EXTERNAL_TRANSACTION_VALIDATED]: { icon: CheckCircle2, colorClass: 'text-emerald-600 bg-emerald-100' },
  [NotificationType.EXTERNAL_TRANSACTION_CREATED]: { icon: Landmark, colorClass: 'text-indigo-600 bg-indigo-100' },
  [NotificationType.EXTERNAL_TRANSACTION_CANCELLED]: { icon: XCircle, colorClass: 'text-red-600 bg-red-100' },
  [NotificationType.ACCOUNTING_ACCESS_REQUESTED]: { icon: KeyRound, colorClass: 'text-purple-600 bg-purple-100' },
  [NotificationType.ACCOUNTING_ACCESS_APPROVED]: { icon: CheckCircle2, colorClass: 'text-emerald-600 bg-emerald-100' },
  [NotificationType.ACCOUNTING_ACCESS_REJECTED]: { icon: XCircle, colorClass: 'text-red-600 bg-red-100' },
};

const DEFAULT_DISPLAY = { icon: Bell, colorClass: 'text-slate-500 bg-slate-100' };

export const getNotificationDisplay = (type: NotificationType): { icon: LucideIcon; colorClass: string } =>
  NOTIFICATION_DISPLAY[type] ?? DEFAULT_DISPLAY;

export const NotificationTypeIcon: React.FC<{ type: NotificationType; className?: string }> = ({ type, className }) => {
  const { icon: Icon } = getNotificationDisplay(type);
  return <Icon className={className} />;
};
