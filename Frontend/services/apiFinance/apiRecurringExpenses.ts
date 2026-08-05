import { api } from '../api';
import { RecurringExpense } from '../../types';

export type RecurringExpenseCreationData = Omit<
  RecurringExpense,
  'id' | 'subsidiaryId' | 'nextExecutionDate' | 'isActive'
>;

export type RecurringExpenseUpdateData = Partial<RecurringExpenseCreationData> & {
  isActive?: boolean;
};

export const getRecurringExpenses = async (): Promise<RecurringExpense[]> => {
  const { data } = await api.get<{ data: RecurringExpense[] }>('/finance/recurring-expenses', { params: { limit: 500 } });
  return data.data;
};

export const createRecurringExpense = async (
  payload: RecurringExpenseCreationData,
): Promise<RecurringExpense> => {
  const { data } = await api.post<RecurringExpense>('/finance/recurring-expenses', payload);
  return data;
};

export const updateRecurringExpense = async (
  id: string,
  payload: RecurringExpenseUpdateData,
): Promise<RecurringExpense> => {
  const { data } = await api.patch<RecurringExpense>(`/finance/recurring-expenses/${id}`, payload);
  return data;
};

export const deleteRecurringExpense = async (id: string): Promise<void> => {
  await api.delete(`/finance/recurring-expenses/${id}`);
};
