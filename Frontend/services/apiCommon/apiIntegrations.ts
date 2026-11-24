import { api } from '../api';

export type IntegrationCategory = 'infrastructure' | 'server' | 'browser' | 'seed' | 'link';
export type CheckState = 'passed' | 'failed' | 'stale' | 'neverChecked' | 'requiresSetup' | 'inactive' | 'unmonitored';

export interface IntegrationCheck {
  id: number;
  status: 'passed' | 'failed' | 'skipped';
  diagnostic: string | null;
  durationMs: number | null;
  checkedAt: string;
}

export interface Integration {
  id: string;
  category: IntegrationCategory;
  capability: string | null;
  configuration: 'configured' | 'incomplete' | 'disabled' | 'notApplicable';
  checkState: CheckState;
  lastCheck: IntegrationCheck | null;
}

export async function getIntegrations() {
  const { data } = await api.get<Integration[]>('/integrations');
  return data;
}

export async function getIntegrationChecks(id: string, beforeId?: number) {
  const { data } = await api.get<{ checks: IntegrationCheck[]; nextBeforeId: number | null }>(
    `/integrations/${encodeURIComponent(id)}/checks`,
    { params: { beforeId } },
  );
  return data;
}
