import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { getStaffOrderById } from '../services/apiE-commerce/apiOrders';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { useToast } from '../context/ToastContext';

export function useOrderNotificationSelection(route: '/dashboard/production' | '/dashboard/sales') {
  const hash = useRouterState({ select: state => state.location.hash }).replace(/^#/, '');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const toast = useToast();
  const valid = /^[a-zA-Z0-9_-]{1,160}$/.test(hash);
  const query = useQuery({
    queryKey: ['order-notification', user?.id, user?.activeRole ?? user?.userRole, hash],
    queryFn: () => getStaffOrderById(hash), enabled: valid && !!user, retry: false,
  });
  useEffect(() => {
    if (query.isError) toast.error(t('notifications.orderUnavailable'));
  }, [query.isError, t, toast.error]);
  const close = () => { if (hash) void navigate({ to: route, hash: '', replace: true }); };
  return { order: valid ? query.data : undefined, isLoading: valid && query.isLoading, close };
}
