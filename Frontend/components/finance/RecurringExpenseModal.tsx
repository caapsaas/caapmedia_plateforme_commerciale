import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExpenseCategory, ExpenseType, RecurringExpenseFrequency } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import {
  createRecurringExpense,
  RecurringExpenseCreationData,
} from '../../services/apiFinance/apiRecurringExpenses';

interface RecurringExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  subsidiaryId: string;
}

const RecurringExpenseModal: React.FC<RecurringExpenseModalProps> = ({
  isOpen,
  onClose,
  subsidiaryId,
}) => {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.OTHER);
  const [expenseRecordType, setExpenseRecordType] = useState<ExpenseType>(ExpenseType.VARIABLE);
  const [frequency, setFrequency] = useState<RecurringExpenseFrequency>(RecurringExpenseFrequency.MONTHLY);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setAmount(0);
      setCategory(ExpenseCategory.OTHER);
      setExpenseRecordType(ExpenseType.VARIABLE);
      setFrequency(RecurringExpenseFrequency.MONTHLY);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
    }
  }, [isOpen]);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (data: RecurringExpenseCreationData) => createRecurringExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses', subsidiaryId] });
      toast.success(t('recurringExpenses.createSuccess'), t('recurringExpenses.createSuccessMessage'));
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        t('recurringExpenses.createError'),
        error?.response?.data?.message || t('recurringExpenses.createErrorMessage'),
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount <= 0 || !startDate) return;
    submit({
      description,
      amount,
      category,
      expenseRecordType,
      frequency,
      startDate,
      endDate: endDate || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-800">{t('recurringExpenses.modal.addTitle')}</h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('recurringExpenses.modal.description')}</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('recurringExpenses.modal.amount')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('recurringExpenses.modal.frequency')}</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurringExpenseFrequency)}
                    required
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                  >
                    {Object.values(RecurringExpenseFrequency).map((f) => (
                      <option key={f} value={f}>{t(`recurringExpenses.frequency.${f}`)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('recurringExpenses.modal.category')}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    required
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                  >
                    {Object.values(ExpenseCategory).map((c) => (
                      <option key={c} value={c}>{t(`expenses.categories.${c}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('recurringExpenses.modal.type')}</label>
                  <select
                    value={expenseRecordType}
                    onChange={(e) => setExpenseRecordType(e.target.value as ExpenseType)}
                    required
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                  >
                    {Object.values(ExpenseType).map((t2) => (
                      <option key={t2} value={t2}>{t(`expenses.types.${t2}`)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('recurringExpenses.modal.startDate')}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('recurringExpenses.modal.endDate')}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] disabled:opacity-50"
            >
              {isPending ? '...' : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringExpenseModal;
