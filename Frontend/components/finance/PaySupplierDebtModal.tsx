import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AccountType, TreasuryAccount } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { getTreasuryAccounts } from '../../services/apiFinance/apiTreasury';
import { paySupplierDebt } from '../../services/apiFinance/apiDebts';

interface PaySupplierDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtId: string | null;
  supplierName: string;
  reference: string;
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  onPaid?: () => void;
}

/**
 * Modale de paiement d'une dette fournisseur — UNIQUE composant, utilisé à
 * la fois par Finance & Gestion → Dettes fournisseurs (SupplierDebts.tsx) et
 * par le module Achats (Purchasing.tsx) : payer un bon de commande = payer
 * la dette fournisseur qui lui est liée (DebtsService.paySupplierDebt),
 * donc un seul écran de paiement, pas deux qui divergent.
 *
 * Prélèvement exclusivement Coffre-fort/Banque (centralisés au siège),
 * réservé au SUPER_ADMIN — comptes chargés globalement puis filtrés ici.
 * Paiement partiel supporté (montant modifiable, plafonné au solde restant).
 */
const PaySupplierDebtModal: React.FC<PaySupplierDebtModalProps> = ({
  isOpen,
  onClose,
  debtId,
  supplierName,
  reference,
  totalAmount,
  amountPaid,
  remainingAmount,
  onPaid,
}) => {
  const { t, formatCurrency } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState(remainingAmount);
  const [treasuryAccountId, setTreasuryAccountId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount(remainingAmount);
      setTreasuryAccountId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, remainingAmount]);

  const { data: allAccounts = [] } = useQuery<TreasuryAccount[]>({
    queryKey: ['treasuryAccounts', 'all'],
    queryFn: () => getTreasuryAccounts(),
    enabled: isOpen,
  });
  const accounts = useMemo(
    () => allAccounts.filter((a) => a.accountType === AccountType.SAFE || a.accountType === AccountType.BANQUE),
    [allAccounts],
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const newAmount = isNaN(value) ? 0 : Math.max(0, Math.min(value, remainingAmount));
    setAmount(newAmount);
  };

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => {
      if (!debtId) throw new Error('No debt selected');
      return paySupplierDebt(debtId, {
        amount,
        treasuryAccountId,
        paymentDate: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierDebts'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['treasuryAccounts'] });
      toast.success(t('supplierDebts.paymentSuccess'), t('supplierDebts.paymentSuccessMessage'));
      onPaid?.();
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
    if (!debtId || amount <= 0 || !treasuryAccountId) return;
    submit();
  };

  if (!isOpen || !debtId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <h3 className="text-lg font-bold text-slate-900">{t('supplierDebts.payModal.title')}</h3>
            <p className="text-sm text-slate-500">{supplierName} — {reference}</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-4 bg-slate-100 rounded-lg text-center">
              <p className="text-sm text-slate-600">{t('purchasing.paymentModal.totalAmount')}</p>
              <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{t('purchasing.paymentModal.amountPaid')}</span>
              <span className="font-semibold text-green-600">{formatCurrency(amountPaid)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-slate-600">{t('purchasing.paymentModal.remainingBalance')}</span>
              <span className="text-red-600">{formatCurrency(remainingAmount)}</span>
            </div>
            <div>
              <label htmlFor="treasuryAccountId" className="block text-sm font-medium text-slate-700">{t('supplierDebts.payModal.account')}</label>
              <select
                id="treasuryAccountId"
                value={treasuryAccountId}
                onChange={(e) => setTreasuryAccountId(e.target.value)}
                required
                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
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
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700">{t('purchasing.paymentModal.amountToPay')}</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={amount}
                onChange={handleAmountChange}
                max={remainingAmount}
                min="0"
                required
                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
              />
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending || amount <= 0 || !treasuryAccountId}
              className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors disabled:opacity-50"
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
