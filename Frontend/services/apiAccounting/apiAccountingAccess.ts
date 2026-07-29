import { api } from '../api';

export type AccountingAccessStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AccountingAccessRequest {
  id: string;
  userId: string;
  justification: string;
  status: AccountingAccessStatus;
  requestedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionNote: string | null;
  expiresAt: string | null;
  user?: { userName: string; email: string };
  reviewer?: { userName: string } | null;
}

export type MyAccessStatus =
  | { hasAccess: true; reason: 'HEADQUARTER_ADMIN' }
  | { hasAccess: true; reason: 'APPROVED'; expiresAt: string }
  | { hasAccess: false; reason: 'PENDING'; requestId: string }
  | { hasAccess: false; reason: 'NONE' };

export const getMyAccessStatus = async (): Promise<MyAccessStatus> => {
  const { data } = await api.get<MyAccessStatus>('/accounting-access/my-status');
  return data;
};

export const getPendingAccessCount = async (): Promise<number> => {
  const { data } = await api.get<number>('/accounting-access/pending-count');
  return data;
};

export const getAccessRequests = async (): Promise<AccountingAccessRequest[]> => {
  const { data } = await api.get<AccountingAccessRequest[]>('/accounting-access');
  return data;
};

export const createAccessRequest = async (justification: string): Promise<AccountingAccessRequest> => {
  const { data } = await api.post<AccountingAccessRequest>('/accounting-access/request', { justification });
  return data;
};

export const approveAccessRequest = async (
  id: string,
  duration: number,
  unit: 'HOURS' | 'DAYS',
): Promise<AccountingAccessRequest> => {
  const { data } = await api.patch<AccountingAccessRequest>(`/accounting-access/${id}/approve`, {
    duration,
    unit,
  });
  return data;
};

export const rejectAccessRequest = async (
  id: string,
  rejectionNote?: string,
): Promise<AccountingAccessRequest> => {
  const { data } = await api.patch<AccountingAccessRequest>(`/accounting-access/${id}/reject`, {
    rejectionNote,
  });
  return data;
};
