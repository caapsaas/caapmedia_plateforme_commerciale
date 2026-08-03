import { api } from '../api';
import { PaginatedResponse, PaginationParams } from '../../types/pagination.types';

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

/**
 * Conservé pour les vues qui ont besoin de la liste complète en mémoire
 * (recherche/export/impression client-side dans ChartOfAccounts.tsx). Limit
 * élevée : le plan comptable reste par nature une liste bornée (quelques
 * centaines de comptes au maximum).
 */
export const getAccounts = async (type?: AccountingAccountType): Promise<AccountingAccount[]> => {
  const params = { ...(type ? { type } : {}), limit: 500 };
  const { data } = await api.get<PaginatedResponse<AccountingAccount>>('/accounting/accounts', { params });
  return data.data;
};

/**
 * Version paginée/recherchable pour les selects de compte (AsyncSelect) —
 * évite de charger tout le plan comptable dans un <select> natif.
 */
export const getAccountsPaginated = async (
  params: PaginationParams & { type?: AccountingAccountType },
): Promise<PaginatedResponse<AccountingAccount>> => {
  const { data } = await api.get<PaginatedResponse<AccountingAccount>>('/accounting/accounts', { params });
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
