import { api } from '../api';

export type AccountingAccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface AccountingAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: AccountingAccountType;
  class: number | null;
  parentAccountId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountDto {
  accountNumber: string;
  accountName: string;
  accountType: AccountingAccountType;
  class?: number;
  parentAccountId?: string;
}

export const seedAccounting = async (): Promise<{ message: string }> => {
  const { data } = await api.post('/accounting/accounts/seed');
  return data;
};

export const getAccounts = async (type?: AccountingAccountType): Promise<AccountingAccount[]> => {
  const params = type ? { type } : {};
  const { data } = await api.get<AccountingAccount[]>('/accounting/accounts', { params });
  return data;
};

export const createAccount = async (dto: CreateAccountDto): Promise<AccountingAccount> => {
  const { data } = await api.post<AccountingAccount>('/accounting/accounts', dto);
  return data;
};

export const updateAccount = async (
  id: string,
  dto: Partial<CreateAccountDto>,
): Promise<AccountingAccount> => {
  const { data } = await api.patch<AccountingAccount>(`/accounting/accounts/${id}`, dto);
  return data;
};

export const deactivateAccount = async (id: string): Promise<AccountingAccount> => {
  const { data } = await api.patch<AccountingAccount>(`/accounting/accounts/${id}/deactivate`);
  return data;
};
