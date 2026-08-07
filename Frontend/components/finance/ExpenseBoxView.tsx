import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Subsidiary, TreasuryAccount, FinancialTransaction, AccountType, UserRole } from '../../types';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { getTreasuryAccounts, getFinancialTransactions } from '../../services/apiFinance/apiTreasury';
import { getTransactionLegForAccount } from '../../utils/transactionDisplay';
import ExpenseBoxDisbursementModal from './ExpenseBoxDisbursementModal';
import AccountHistoryModal from './AccountHistoryModal';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';

interface ExpenseBoxViewProps {
  subsidiary: Subsidiary;
}

// Caisse dépense de la filiale — déplacée du module Décaissement (réservé au
// SUPER_ADMIN) vers Finance & Gestion : gérée par le Directeur Financier de
// CHAQUE filiale (une seule caisse dépense par filiale, voir
// TreasuryService.createAccount), calqué sur
// Frontend_GMO/components/analytics/ExpenseBoxView.tsx.
const ExpenseBoxView: React.FC<ExpenseBoxViewProps> = ({ subsidiary }) => {
  const { t, formatCurrency, language } = useI18n();
  const { user } = useAuth();
  const activeRole = user?.activeRole ?? user?.userRole;
  const canDisburse = activeRole === UserRole.FINANCIAL_DIRECTOR;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<TreasuryAccount[]>({
    queryKey: ['treasuryAccounts', subsidiary.id],
    queryFn: () => getTreasuryAccounts(subsidiary.id),
  });

  const expenseBox = useMemo(
    () => accounts.find((a) => a.accountType === AccountType.EXPENSE_BOX) ?? null,
    [accounts],
  );

  const { data: transactions = [], isLoading: isLoadingTx } = useQuery<FinancialTransaction[]>({
    queryKey: ['financialTransactions', subsidiary.id],
    queryFn: () => getFinancialTransactions(subsidiary.id),
    enabled: !!expenseBox,
  });

  const expenseBoxTransactions = useMemo(
    () =>
      expenseBox
        ? transactions.filter((tx) => tx.treasuryAccountId === expenseBox.id || tx.destinationAccountId === expenseBox.id)
        : [],
    [transactions, expenseBox],
  );

  if (isLoadingAccounts) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md animate-pulse space-y-3">
        <div className="h-6 bg-slate-200 rounded w-48" />
        <div className="h-24 bg-slate-100 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-[#c6e911]/10 to-white p-6 rounded-xl border border-[#c6e911]/30 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{t('expenseBoxDisbursement.title')}</h3>
          <p className="text-sm text-slate-600 mt-1">{t('expenseBoxDisbursement.subtitle')}</p>
          {expenseBox && (
            <button onClick={() => setHistoryOpen(true)} className="mt-2 text-2xl font-bold text-slate-800 hover:underline">
              {formatCurrency(expenseBox.balance)}
            </button>
          )}
        </div>
        {canDisburse && (
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!expenseBox}
            className="mt-4 sm:mt-0 bg-[#231F20] hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {t('treasuryAccounts.view.disbursement')}
          </button>
        )}
      </div>

      {!expenseBox ? (
        <EmptyState icon="finance" title={t('expenseBoxDisbursement.noExpenseBox')} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200 bg-slate-50 rounded-t-xl">
            <h4 className="font-semibold text-slate-900">{t('treasuryAccounts.view.movementsSection')}</h4>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-max w-full">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr className="whitespace-nowrap">
                  <th className="px-4 py-3">{t('treasury.date')}</th>
                  <th className="px-4 py-3">{t('treasury.description')}</th>
                  <th className="px-4 py-3">{t('treasury.history.direction')}</th>
                  <th className="px-4 py-3">{t('treasury.history.counterparty')}</th>
                  <th className="px-4 py-3">{t('cashRemittance.table.status')}</th>
                  <th className="px-4 py-3 text-right">{t('treasury.amount')}</th>
                  <th className="px-4 py-3 text-right">{t('treasury.history.balanceBefore')}</th>
                  <th className="px-4 py-3 text-right">{t('treasury.history.balanceAfter')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTx ? (
                  <TableSkeleton rows={5} columns={8} />
                ) : expenseBoxTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState icon="finance" title={t('treasuryAccounts.view.movementsSection')} description={t('common.notAvailable')} />
                    </td>
                  </tr>
                ) : (
                  expenseBoxTransactions.map((tx) => {
                    const { isIncome, counterpartyName, balanceBefore, balanceAfter } = getTransactionLegForAccount(tx, expenseBox!.id);
                    return (
                      <tr key={tx.id} className="bg-white border-b hover:bg-slate-50 whitespace-nowrap">
                        <td className="px-4 py-3">{new Date(tx.transactionDate).toLocaleDateString(language)}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{tx.description}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isIncome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {isIncome ? t('treasury.history.income') : t('treasury.history.expense')}
                          </span>
                        </td>
                        <td className="px-4 py-3">{counterpartyName}</td>
                        <td className="px-4 py-3">{tx.status ? t(`treasury.treasuryStatus.${tx.status}`) : '-'}</td>
                        <td className={`px-4 py-3 text-right font-bold ${isIncome ? 'text-green-700' : 'text-red-700'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                        </td>
                        <td className="px-4 py-3 text-right">{balanceBefore != null ? formatCurrency(balanceBefore) : '—'}</td>
                        <td className="px-4 py-3 text-right">{balanceAfter != null ? formatCurrency(balanceAfter) : '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      <ExpenseBoxDisbursementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} expenseBox={expenseBox} />
      <AccountHistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} account={expenseBox} />
    </div>
  );
};

export default ExpenseBoxView;
