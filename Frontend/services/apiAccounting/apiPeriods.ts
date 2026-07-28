import { api } from '../api';

export interface FiscalYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClosed: boolean;
  subsidiaryId: string;
}

export interface CreateFiscalYearDto {
  name: string;
  startDate: string;
  endDate: string;
}

export const getFiscalYears = async (): Promise<FiscalYear[]> => {
  const { data } = await api.get<FiscalYear[]>('/accounting/periods');
  return data;
};

export const createFiscalYear = async (dto: CreateFiscalYearDto): Promise<FiscalYear> => {
  const { data } = await api.post<FiscalYear>('/accounting/periods', dto);
  return data;
};

export const closeFiscalYear = async (id: string): Promise<FiscalYear> => {
  const { data } = await api.patch<FiscalYear>(`/accounting/periods/${id}/close`);
  return data;
};

export const reopenFiscalYear = async (id: string): Promise<FiscalYear> => {
  const { data } = await api.patch<FiscalYear>(`/accounting/periods/${id}/reopen`);
  return data;
};
