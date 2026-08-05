import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SupplierDebt, TreasuryAccount } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { getTreasuryAccounts } from '../../services/apiFinance/apiTreasury';
import { paySupplierDebt } from '../../services/apiFinance/apiDebts';

interface PaySupplierDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  subsidiaryId: string;
  debt: SupplierDebt | null;
}

const PaySupplierDebtModal: React.FC<PaySupplierDebtModalProps> = ({
  isOpen,
  onClose,
  subsidiaryId,
  debt,
}) => {
  const { t, formatCurrency } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [treasuryAccountId, setTreasuryAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      setTreasuryAccountId('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const { data: accounts = [] } = useQuery<TreasuryAccount[]>({
    queryKey: ['treasuryAccounts', subsidiaryId],
    queryFn: () => getTreasuryAccounts(subsidiaryId),
    enabled: isOpen && !!subsidiaryId,
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => {
      if (!debt) throw new Error('No debt selected');
      return paySupplierDebt(debt.id, { treasuryAccountId, paymentDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierDebts', subsidiaryId] });
      queryClient.invalidateQueries({ queryKey: ['treasuryAccounts', subsidiaryId] });
      toast.success(t('supplierDebts.paymentSuccess'), t('supplierDebts.paymentSuccessMessage'));
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        t('supplierDebts.paymentError'),
        error?.response?.data?.message || t('supplierDebts.paymentErrorMessage'),
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!treasuryAccountId) return;
    submit();
  };

  if (!isOpen || !debt) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-800">{t('supplierDebts.payModal.title')}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {debt.supplierName} — {debt.invoiceId} — <span className="font-semibold">{formatCurrency(debt.amount)}</span>
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('supplierDebts.payModal.account')}</label>
                <select
                  value={treasuryAccountId}
                  onChange={(e) => setTreasuryAccountId(e.target.value)}
                  required
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                >
                  <option value="">-- {t('common.select')} --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} - {formatCurrency(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">{t('supplierDebts.payModal.date')}</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                />
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
              {isPending ? '...' : t('supplierDebts.payModal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaySupplierDebtModal;
