import { api } from '../api';
import { PaginatedResponse, PaginationParams } from '../../types/pagination.types';

export type JournalEntryStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export interface JournalEntryLine {
  id: string;
  accountId: string;
  account?: { accountNumber: string; accountName: string };
  description: string | null;
  debitAmount: number;
  creditAmount: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  status: JournalEntryStatus;
  fiscalYearId: string | null;
  subsidiaryId: string;
  journalId: string;
  journal?: { code: string; name: string };
  sequentialNumber: string | null;
  reversalOfEntryId: string | null;
  sourceType: string | null;
  sourceId: string | null;
  lines: JournalEntryLine[];
  createdAt: string;
}

export interface CreateEntryLineDto {
  accountId: string;
  description?: string;
  debitAmount: number;
  creditAmount: number;
}

export interface CreateEntryDto {
  entryDate: string;
  description: string;
  journalId: string;
  fiscalYearId?: string;
  lines: CreateEntryLineDto[];
}

/**
 * Charge toutes les écritures correspondant aux filtres (compat — limite
 * haute, pour les vues qui ont besoin du jeu de données complet : tri/export
 * côté client dans JournalEntries.tsx, agrégats dans AccountingDashboard.tsx).
 */
export const getEntries = async (
  fiscalYearId?: string,
  status?: JournalEntryStatus,
  startDate?: string,
  endDate?: string,
  subsidiaryId?: string,
): Promise<JournalEntry[]> => {
  const params: Record<string, string | number> = { limit: 500 };
  if (fiscalYearId) params.fiscalYearId = fiscalYearId;
  if (status) params.status = status;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (subsidiaryId) params.subsidiaryId = subsidiaryId;
  const { data } = await api.get<PaginatedResponse<JournalEntry>>('/accounting/entries', { params });
  return data.data;
};

/**
 * Version paginée/recherchable (page/limit/search) pour un futur usage en
 * pagination cliquable réelle.
 */
export const getEntriesPaginated = async (
  params: PaginationParams & {
    fiscalYearId?: string;
    status?: JournalEntryStatus;
    startDate?: string;
    endDate?: string;
    subsidiaryId?: string;
  },
): Promise<PaginatedResponse<JournalEntry>> => {
  const { data } = await api.get<PaginatedResponse<JournalEntry>>('/accounting/entries', { params });
  return data;
};

export const getEntry = async (id: string): Promise<JournalEntry> => {
  const { data } = await api.get<JournalEntry>(`/accounting/entries/${id}`);
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

/** N'est autorisé que sur une écriture DRAFT — utiliser `reverseEntry` pour une écriture POSTED. */
export const cancelEntry = async (id: string): Promise<JournalEntry> => {
  const { data } = await api.patch<JournalEntry>(`/accounting/entries/${id}/cancel`);
  return data;
};

/** Extourne (contre-passation) d'une écriture validée — la seule façon de corriger une écriture POSTED. */
export const reverseEntry = async (id: string): Promise<JournalEntry> => {
  const { data } = await api.post<JournalEntry>(`/accounting/entries/${id}/reverse`);
  return data;
};
