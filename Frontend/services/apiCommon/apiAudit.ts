import { api } from '../api';

export interface SystemAuditLogEntry {
  id: string;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  subsidiaryId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface AuthAuditLogEntry {
  id: string;
  event: string;
  userId?: string | null;
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AuditListResponse<T> {
  entries: T[];
  total: number;
  take: number;
  skip: number;
}

export const getSystemAuditLogs = async (params: {
  action?: string;
  entityType?: string;
  subsidiaryId?: string;
  actorEmail?: string;
  startDate?: string;
  endDate?: string;
  take?: number;
  skip?: number;
}): Promise<AuditListResponse<SystemAuditLogEntry>> => {
  const { data } = await api.get<AuditListResponse<SystemAuditLogEntry>>('/audit/system', {
    params,
  });
  return data;
};

export const getAuthAuditLogs = async (params: {
  email?: string;
  event?: string;
  take?: number;
  skip?: number;
}): Promise<AuditListResponse<AuthAuditLogEntry>> => {
  const { data } = await api.get<AuditListResponse<AuthAuditLogEntry>>('/auth/audit-log', {
    params,
  });
  return data;
};
