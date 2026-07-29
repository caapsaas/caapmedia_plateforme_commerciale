import { api } from '../api';

export type JournalType = 'VENTES' | 'ACHATS' | 'BANQUE' | 'CAISSE' | 'OD';

export interface AccountingJournal {
  id: string;
  code: string;
  name: string;
  journalType: JournalType;
  isActive: boolean;
}

export const getJournals = async (): Promise<AccountingJournal[]> => {
  const { data } = await api.get<AccountingJournal[]>('/accounting/journals');
  return data;
};

export const seedJournals = async (): Promise<{ message: string }> => {
  const { data } = await api.post('/accounting/journals/seed');
  return data;
};
