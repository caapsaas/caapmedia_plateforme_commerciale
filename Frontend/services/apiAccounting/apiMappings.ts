import { api } from '../api';

export interface AccountMapping {
  id: string;
  key: string;
  accountCode: string;
}

export const getMappings = async (): Promise<AccountMapping[]> => {
  const { data } = await api.get<AccountMapping[]>('/accounting/mappings');
  return data;
};

export const updateMapping = async (key: string, accountCode: string): Promise<AccountMapping> => {
  const { data } = await api.patch<AccountMapping>(`/accounting/mappings/${key}`, { accountCode });
  return data;
};

export const seedMappings = async (): Promise<{ message: string }> => {
  const { data } = await api.post('/accounting/mappings/seed');
  return data;
};
