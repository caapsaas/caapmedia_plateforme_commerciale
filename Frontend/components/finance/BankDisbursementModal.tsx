import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AccountType, TreasuryAccount, TreasuryTransactionType } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { getTreasuryAccounts, createDisbursement } from '../../services/apiFinance/apiTreasury';

interface BankDisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Décaissement depuis un compte Banque — réservé au SUPER_ADMIN, calqué sur
// Frontend_GMO/components/analytics/BankDisbursementModal.tsx : plus simple
// que le coffre-fort, uniquement salaires/primes réglés par virement.
const BankDisbursementModal: React.FC<BankDisbursementModalProps> = ({ isOpen, onClose }) => {
  const { t, formatCurrency } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sourceAccountId, setSourceAccountId] = useState('');
  const [treasuryType, setTreasuryType] = useState<TreasuryTransactionType>(TreasuryTransactionType.SALARY_PAYMENT);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');

  const resetForm = () => {
    setSourceAccountId('');
    setTreasuryType(TreasuryTransactionType.SALARY_PAYMENT);
    setAmount('');
    setDescription('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setReference('');
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  const { data: accounts = [] } = useQuery<TreasuryAccount[]>({
    queryKey: ['treasuryAccounts', 'all'],
    queryFn: () => getTreasuryAccounts(),
    enabled: isOpen,
  });

  const bankAccounts = useMemo(() => accounts.filter((a) => a.accountType === AccountType.BANQUE), [accounts]);
  const selectedSource = bankAccounts.find((a) => a.id === sourceAccountId);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () =>
      createDisbursement({
        transactionDate,
        description,
        amount: parseFloat(amount) || 0,
        sourceAccountId,
        treasuryType,
        reference: reference || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasuryAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['financialTransactions'] });
      toast('success', t('bankDisbursement.successMessage'));
      onClose();
    },
    onError: (error: any) => {
      toast('error', error?.response?.data?.message || t('common.error'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceAccountId || !amount || parseFloat(amount) <= 0 || !description) return;
    submit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b bg-gradient-to-r from-[#c6e911]/15 to-white">
          <h3 className="text-lg font-bold text-slate-800">{t('bankDisbursement.title')}</h3>
          <p className="text-sm text-slate-600 mt-1">{t('bankDisbursement.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">{t('bankDisbursement.sourceAccount')}</label>
            <select value={sourceAccountId} onChange={(e) => setSourceAccountId(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border bg-white">
              <option value="">{t('bankDisbursement.selectBank')}</option>
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.accountName} — {t('bankDisbursement.balance')} {formatCurrency(acc.balance)}</option>
              ))}
            </select>
            {selectedSource && parseFloat(amount || '0') > selectedSource.balance && (
              <p className="mt-1 text-xs text-red-600">{t('safeDisbursement.insufficientBalance', { balance: formatCurrency(selectedSource.balance) })}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">{t('bankDisbursement.operationType')}</label>
            <select value={treasuryType} onChange={(e) => setTreasuryType(e.target.value as TreasuryTransactionType)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border bg-white">
              <option value={TreasuryTransactionType.SALARY_PAYMENT}>{t('bankDisbursement.salaryPayment')}</option>
              <option value={TreasuryTransactionType.BONUS_PAYMENT}>{t('bankDisbursement.bonusPayment')}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('bankDisbursement.amount')}</label>
              <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.date')}</label>
              <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">{t('bankDisbursement.description')}</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border" placeholder={t('bankDisbursement.descriptionPlaceholder')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.reference')}</label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-[#231F20] text-white rounded-md hover:bg-slate-700 transition-colors disabled:opacity-50">
              {isPending ? t('bankDisbursement.submitting') : t('bankDisbursement.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankDisbursementModal;
