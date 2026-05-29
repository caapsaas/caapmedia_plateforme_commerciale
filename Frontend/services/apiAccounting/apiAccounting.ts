import { api } from '../api';

// ===================== TYPES =====================

export type AccountType =
  | 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | 'BALANCE';

export type JournalEntryStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export type FiscalPeriodStatus = 'OPEN' | 'CLOSED';

export interface AccountingAccount {
  id: string;
  accountNumber: string;
  label: string;
  type: AccountType;
  isActive: boolean;
  subsidiaryId: string;
}

export interface AccountingJournal {
  id: string;
  code: string;
  label: string;
  subsidiaryId: string;
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  account?: { accountNumber: string; label: string };
  label: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  status: JournalEntryStatus;
  journalId: string;
  journal?: { code: string; label: string };
  fiscalYearId: string;
  lines: JournalEntryLine[];
  createdAt: string;
}

export interface FiscalPeriod {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  status: FiscalPeriodStatus;
  subsidiaryId: string;
  createdAt: string;
}

// Report types
export interface GrandLivreEntry {
  date: string;
  description: string;
  entryNumber: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface GrandLivreAccount {
  accountNumber: string;
  label: string;
  entries: GrandLivreEntry[];
  totalDebit: number;
  totalCredit: number;
  finalBalance: number;
}

export interface BalanceGeneraleLine {
  accountNumber: string;
  label: string;
  mouvDebit: number;
  mouvCredit: number;
  soldeDebiteur: number;
  soldeCrediteur: number;
}

export interface JournalCentralisateurEntry {
  journalCode: string;
  journalLabel: string;
  totalDebit: number;
  totalCredit: number;
  entries: { entryNumber: string; date: string; description: string; debit: number; credit: number }[];
}

export interface SyscohadaBilanLine {
  label: string;
  brut: number;
  amortissement: number;
  net: number;
}

export interface SyscohadaResultLine {
  label: string;
  amount: number;
}

export interface SyscohadaStatements {
  bilan: {
    actif: SyscohadaBilanLine[];
    totalActif: number;
    passif: { label: string; amount: number }[];
    totalPassif: number;
  };
  resultat: {
    produits: SyscohadaResultLine[];
    charges: SyscohadaResultLine[];
    resultatNet: number;
    ebe: number;
    margeCommerciale: number;
  };
}

// ===================== DTOs =====================

export interface CreateEntryDto {
  entryDate: string;
  description: string;
  journalId: string;
  fiscalYearId: string;
  lines: { accountId: string; label: string; debit: number; credit: number }[];
}

// ===================== ACCOUNTS =====================

export const seedAccounting = async (): Promise<{ message: string }> => {
  const { data } = await api.post('/accounting/accounts/seed');
  return data;
};

export const getAccounts = async (type?: AccountType): Promise<AccountingAccount[]> => {
  const params = type ? { type } : {};
  const { data } = await api.get<AccountingAccount[]>('/accounting/accounts', { params });
  return data;
};

export const createAccount = async (dto: {
  accountNumber: string;
  label: string;
  type: AccountType;
}): Promise<AccountingAccount> => {
  const { data } = await api.post<AccountingAccount>('/accounting/accounts', dto);
  return data;
};

export const updateAccount = async (id: string, dto: Partial<{
  label: string;
  type: AccountType;
}>): Promise<AccountingAccount> => {
  const { data } = await api.patch<AccountingAccount>(`/accounting/accounts/${id}`, dto);
  return data;
};

export const deactivateAccount = async (id: string): Promise<AccountingAccount> => {
  const { data } = await api.patch<AccountingAccount>(`/accounting/accounts/${id}/deactivate`);
  return data;
};

// ===================== JOURNALS =====================

export const getJournals = async (): Promise<AccountingJournal[]> => {
  const { data } = await api.get<AccountingJournal[]>('/accounting/journals');
  return data;
};

// ===================== ENTRIES =====================

export const getEntries = async (fiscalYearId?: string, status?: JournalEntryStatus): Promise<JournalEntry[]> => {
  const params: Record<string, string> = {};
  if (fiscalYearId) params.fiscalYearId = fiscalYearId;
  if (status) params.status = status;
  const { data } = await api.get<JournalEntry[]>('/accounting/entries', { params });
  return data;
};

export const createEntry = async (dto: CreateEntryDto): Promise<JournalEntry> => {
  const { data } = await api.post<JournalEntry>('/accounting/entries', dto);
  return data;
};

export const postEntry = async (id: string): Promise<JournalEntry> => {
  const { data } = await api.patch<JournalEntry>(`/accounting/entries/${id}/post`);
  return data;
};

export const cancelEntry = async (id: string): Promise<JournalEntry> => {
  const { data } = await api.patch<JournalEntry>(`/accounting/entries/${id}/cancel`);
  return data;
};

// ===================== FISCAL PERIODS =====================

export const getFiscalPeriods = async (): Promise<FiscalPeriod[]> => {
  const { data } = await api.get<FiscalPeriod[]>('/accounting/periods');
  return data;
};

export const closeFiscalPeriod = async (id: string): Promise<FiscalPeriod> => {
  const { data } = await api.patch<FiscalPeriod>(`/accounting/periods/${id}/close`);
  return data;
};

// ===================== REPORTS =====================

export const getGrandLivre = async (fiscalYearId?: string): Promise<GrandLivreAccount[]> => {
  const params = fiscalYearId ? { fiscalYearId } : {};
  const { data } = await api.get<GrandLivreAccount[]>('/accounting/reports/grand-livre', { params });
  return data;
};

export const getBalanceGenerale = async (fiscalYearId?: string): Promise<BalanceGeneraleLine[]> => {
  const params = fiscalYearId ? { fiscalYearId } : {};
  const { data } = await api.get<BalanceGeneraleLine[]>('/accounting/reports/balance-generale', { params });
  return data;
};

export const getJournalCentralisateur = async (fiscalYearId?: string): Promise<JournalCentralisateurEntry[]> => {
  const params = fiscalYearId ? { fiscalYearId } : {};
  const { data } = await api.get<JournalCentralisateurEntry[]>('/accounting/reports/journal-centralisateur', { params });
  return data;
};

export const getSyscohadaStatements = async (fiscalYearId?: string): Promise<SyscohadaStatements> => {
  const params = fiscalYearId ? { fiscalYearId } : {};
  const { data } = await api.get<SyscohadaStatements>('/accounting/reports/syscohada', { params });
  return data;
};
