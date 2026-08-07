import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FinancialTransaction, TransactionStatus, TreasuryAccount, UserRole } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { useHasRole } from '../../hooks/useHasRole';
import { deleteTransaction, getAccountTransactions, updateTransactionStatus } from '../../services/apiFinance/apiTreasury';
import { getTransactionLegForAccount } from '../../utils/transactionDisplay';
import IconCheck from '../icons/IconCheck';
import IconCancelX from '../icons/IconCancelX';

interface AccountHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: TreasuryAccount | null;
}

const AccountHistoryModal: React.FC<AccountHistoryModalProps> = ({ isOpen, onClose, account }) => {
  const { t, formatCurrency, language } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { hasRole } = useHasRole();
  const canValidate = hasRole([UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['accountTransactions', account?.id, startDate, endDate],
    queryFn: () => getAccountTransactions(account!.id, { startDate: startDate || undefined, endDate: endDate || undefined, limit: 100 }),
    enabled: isOpen && !!account,
  });

  const transactions = data?.data ?? [];

  const { mutate: setStatus, isPending } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TransactionStatus }) => updateTransactionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountTransactions', account?.id] });
      queryClient.invalidateQueries({ queryKey: ['treasuryAccounts'] });
      toast.success(t('treasury.history.statusUpdated'), t('treasury.history.statusUpdatedMessage'));
    },
    onError: (error: any) => {
      toast.error(t('treasury.history.statusUpdateError'), error?.response?.data?.message || t('treasury.history.statusUpdateErrorMessage'));
    },
  });

  const { mutate: cancelPending, isPending: isCancelling } = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountTransactions', account?.id] });
      toast.success(t('treasury.history.cancelled'), t('treasury.history.cancelledMessage'));
    },
    onError: (error: any) => {
      toast.error(t('treasury.history.cancelError'), error?.response?.data?.message || t('treasury.history.cancelErrorMessage'));
    },
  });

  const handleCancel = (id: string) => {
    if (window.confirm(t('treasury.history.confirmCancel'))) {
      cancelPending(id);
    }
  };

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{t('treasury.history.title')}</h3>
            <p className="text-sm text-slate-500 mt-1">{account.accountName} — {formatCurrency(account.balance)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <IconCancelX className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t('treasury.history.startDate')}</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t('treasury.history.endDate')}</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]" />
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <div className="min-w-max w-full">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                <tr className="whitespace-nowrap">
                  <th className="px-4 py-3">{t('treasury.history.date')}</th>
                  <th className="px-4 py-3">{t('treasury.history.description')}</th>
                  <th className="px-4 py-3">{t('treasury.history.direction')}</th>
                  <th className="px-4 py-3">{t('treasury.history.counterparty')}</th>
                  <th className="px-4 py-3">{t('treasury.history.reference')}</th>
                  <th className="px-4 py-3 text-right">{t('treasury.history.amount')}</th>
                  <th className="px-4 py-3 text-right">{t('treasury.history.balanceBefore')}</th>
                  <th className="px-4 py-3 text-right">{t('treasury.history.balanceAfter')}</th>
                  <th className="px-4 py-3 text-center">{t('treasury.history.status')}</th>
                  <th className="px-4 py-3 text-center no-print">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-400">{t('common.loading')}</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-400">{t('common.notAvailable')}</td></tr>
                ) : transactions.map((tx) => {
                  const { isIncome, counterpartyName, balanceBefore, balanceAfter } = getTransactionLegForAccount(tx, account.id);

                  return (
                    <tr key={tx.id} className="bg-white border-b hover:bg-slate-50 whitespace-nowrap">
                      <td className="px-4 py-3">{new Date(tx.transactionDate).toLocaleDateString(language)}</td>
                      <td className="px-4 py-3">{tx.description}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isIncome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {isIncome ? t('treasury.history.income') : t('treasury.history.expense')}
                        </span>
                      </td>
                      <td className="px-4 py-3">{counterpartyName}</td>
                      <td className="px-4 py-3">{tx.reference || '—'}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                      </td>
                      <td className="px-4 py-3 text-right">{balanceBefore != null ? formatCurrency(balanceBefore) : '—'}</td>
                      <td className="px-4 py-3 text-right">{balanceAfter != null ? formatCurrency(balanceAfter) : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tx.status === TransactionStatus.PENDING ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                          {tx.status === TransactionStatus.PENDING ? t('treasury.statusPending') : t('treasury.statusValidated')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center no-print space-x-1">
                        {canValidate && tx.status === TransactionStatus.PENDING && (
                          <>
                            <button
                              disabled={isPending}
                              onClick={() => setStatus({ id: tx.id, status: TransactionStatus.VALIDATED })}
                              className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-100 rounded-full transition-colors disabled:opacity-50"
                              title={t('treasury.validate')}
                            >
                              <IconCheck className="h-5 w-5" />
                            </button>
                            <button
                              disabled={isCancelling}
                              onClick={() => handleCancel(tx.id)}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                              title={t('treasury.reject')}
                            >
                              <IconCancelX className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountHistoryModal;
