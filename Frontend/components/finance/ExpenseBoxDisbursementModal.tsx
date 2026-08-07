import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TreasuryAccount, TreasuryTransactionType } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { createDisbursement } from '../../services/apiFinance/apiTreasury';

interface ExpenseBoxDisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Caisse dépense de la filiale (une seule par filiale — voir
  // TreasuryService.createAccount) : pas de sélecteur, elle est fixée par
  // l'écran appelant (FinanceView.EXPENSE_BOX).
  expenseBox: TreasuryAccount | null;
}

const OPERATION_TYPES = [
  TreasuryTransactionType.RENT,
  TreasuryTransactionType.UTILITIES,
  TreasuryTransactionType.MARKETING,
  TreasuryTransactionType.SUPPLIES,
  TreasuryTransactionType.PURCHASE_COST,
  TreasuryTransactionType.OTHER_EXPENSE,
];

// Décaissement depuis la Caisse Dépense — géré par le Directeur Financier de
// chaque filiale (retiré du module Décaissement, voir Finance.tsx), calqué
// sur Frontend_GMO/components/analytics/ExpenseBoxDisbursementModal.tsx.
const ExpenseBoxDisbursementModal: React.FC<ExpenseBoxDisbursementModalProps> = ({ isOpen, onClose, expenseBox }) => {
  const { t, formatCurrency } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [treasuryType, setTreasuryType] = useState<TreasuryTransactionType>(TreasuryTransactionType.PURCHASE_COST);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      setTreasuryType(TreasuryTransactionType.PURCHASE_COST);
      setAmount('');
      setDescription('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () =>
      createDisbursement({
        transactionDate,
        description,
        amount: parseFloat(amount) || 0,
        sourceAccountId: expenseBox!.id,
        treasuryType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasuryAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['financialTransactions'] });
      toast('success', t('expenseBoxDisbursement.success'));
      onClose();
    },
    onError: (error: any) => {
      toast('error', error?.response?.data?.message || t('common.error'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseBox || !amount || parseFloat(amount) <= 0 || !description) return;
    submit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b bg-gradient-to-r from-[#c6e911]/15 to-white">
          <h3 className="text-lg font-bold text-slate-800">{t('expenseBoxDisbursement.title')}</h3>
          <p className="text-sm text-slate-600 mt-1">{t('expenseBoxDisbursement.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {expenseBox ? (
            <div className="p-3 bg-slate-100 rounded-lg text-center">
              <p className="text-sm text-slate-600">{expenseBox.accountName}</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(expenseBox.balance)}</p>
            </div>
          ) : (
            <p className="text-sm text-red-600">{t('expenseBoxDisbursement.noExpenseBox')}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">{t('expenseBoxDisbursement.operationType')}</label>
            <select value={treasuryType} onChange={(e) => setTreasuryType(e.target.value as TreasuryTransactionType)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border bg-white">
              {OPERATION_TYPES.map((type) => (
                <option key={type} value={type}>{t(`expenseBoxDisbursement.types.${type}`)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.amount')}</label>
              <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.date')}</label>
              <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">{t('expenseBoxDisbursement.description')}</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border" placeholder={t('expenseBoxDisbursement.descriptionPlaceholder')} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isPending || !expenseBox} className="px-4 py-2 bg-[#231F20] text-white rounded-md hover:bg-slate-700 transition-colors disabled:opacity-50">
              {isPending ? t('expenseBoxDisbursement.submitting') : t('expenseBoxDisbursement.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseBoxDisbursementModal;
