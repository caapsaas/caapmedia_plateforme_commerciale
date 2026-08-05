import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Subsidiary, TreasuryAccount, FinancialTransaction, AccountType } from '../../types';
import { useI18n } from '../../i18n';
import { PeriodFilter } from '../../services/apiStatistic/apiAnalytics';
import { resolvePeriodBounds } from '../../utils/periodBounds';
import { getTreasuryAccounts, getFinancialTransactions } from '../../services/apiFinance/apiTreasury';
import DisbursementModal from '../finance/DisbursementModal';
import AccountHistoryModal from '../finance/AccountHistoryModal';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';

interface TreasuryAccountTypeViewProps {
  subsidiary: Subsidiary;
  accountType: AccountType;
  title: string;
  period: PeriodFilter;
  startDate?: string;
  endDate?: string;
}

// Vue "Décaissement" par type de compte de trésorerie (Coffre-fort, Banque,
// Caisse, Caisse dépense) — factorisée plutôt que dupliquée 4 fois (mêmes
// données, seul le filtre de type change). Utilisée exclusivement par la
// page autonome Décaissement (Pages/Disbursement.tsx) — l'onglet Analyse
// (Analytics.tsx) utilise le double sous-onglet Comptes/Transactions de
// TreasuryAccountsAndTransactions.tsx, qui n'a pas de bouton décaissement.
const TreasuryAccountTypeView: React.FC<TreasuryAccountTypeViewProps> = ({
  subsidiary,
  accountType,
  title,
  period,
  startDate,
  endDate,
}) => {
  const { t, formatCurrency, language } = useI18n();
  const [isDisbursementModalOpen, setIsDisbursementModalOpen] = useState(false);
  const [historyAccount, setHistoryAccount] = useState<TreasuryAccount | null>(null);

  const { data: allAccounts = [], isLoading: isLoadingAccounts } = useQuery<TreasuryAccount[]>({
    queryKey: ['treasuryAccounts', subsidiary.id],
    queryFn: () => getTreasuryAccounts(subsidiary.id),
  });

  const accounts = useMemo(
    () => allAccounts.filter((a) => a.accountType === accountType),
    [allAccounts, accountType],
  );
  const accountIds = useMemo(() => new Set(accounts.map((a) => a.id)), [accounts]);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a.accountName])), [accounts]);

  const { data: allTransactions = [], isLoading: isLoadingTx } = useQuery<FinancialTransaction[]>({
    queryKey: ['financialTransactions', subsidiary.id],
    queryFn: () => getFinancialTransactions(subsidiary.id),
    enabled: accounts.length > 0,
  });

  const { start: periodStart, end: periodEnd } = useMemo(
    () => resolvePeriodBounds(period, startDate, endDate),
    [period, startDate, endDate],
  );

  const transactions = useMemo(() => {
    return allTransactions
      .filter(
        (tx) =>
          accountIds.has(tx.treasuryAccountId) ||
          (tx.destinationAccountId && accountIds.has(tx.destinationAccountId)),
      )
      .filter((tx) => {
        if (!periodStart && !periodEnd) return true;
        const txDate = tx.transactionDate.slice(0, 10);
        if (periodStart && txDate < periodStart) return false;
        if (periodEnd && txDate > periodEnd) return false;
        return true;
      });
  }, [allTransactions, accountIds, periodStart, periodEnd]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h4 className="font-semibold text-slate-500">{t('treasuryAccounts.stats.totalAccounts')}</h4>
          <p className="text-3xl font-bold text-slate-800 mt-2">{accounts.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h4 className="font-semibold text-slate-500">{t('treasuryAccounts.stats.totalBalance')}</h4>
          <p className="text-3xl font-bold text-slate-800 mt-2">{formatCurrency(totalBalance)}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
          <button
            onClick={() => setIsDisbursementModalOpen(true)}
            disabled={accounts.length === 0}
            className="px-4 py-2 bg-[#231F20] text-white text-sm font-semibold rounded-md hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {t('treasuryAccounts.view.disbursement')}
          </button>
        </div>

        <h4 className="text-sm font-semibold text-slate-500 uppercase mb-3">{t('treasuryAccounts.view.accountsSection')}</h4>
        {accounts.length === 0 ? (
          <EmptyState icon="finance" title={title} description={t('common.notAvailable')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setHistoryAccount(acc)}
                className="bg-white p-6 rounded-xl shadow-md flex flex-col text-left hover:shadow-lg transition-shadow"
              >
                <h4 className="font-semibold text-slate-500 truncate" title={acc.accountName}>{acc.accountName}</h4>
                {acc.accountNumber && <p className="text-xs text-slate-400 truncate">{acc.accountNumber}</p>}
                <div className="flex-grow flex items-end mt-2">
                  <p className="text-3xl font-bold text-slate-800 whitespace-nowrap">{formatCurrency(acc.balance)}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <h4 className="text-sm font-semibold text-slate-500 uppercase mb-3">{t('treasuryAccounts.view.movementsSection')}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-3">{t('treasury.date')}</th>
                <th className="px-4 py-3">{t('treasury.description')}</th>
                <th className="px-4 py-3">{t('treasury.account')}</th>
                <th className="px-4 py-3">{t('treasury.history.reference')}</th>
                <th className="px-4 py-3 text-right">{t('treasury.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingTx ? (
                <TableSkeleton rows={5} columns={5} />
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState icon="finance" title={t('treasuryAccounts.view.movementsSection')} description={t('common.notAvailable')} />
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="bg-white border-b hover:bg-slate-50">
                    <td className="px-4 py-3">{new Date(tx.transactionDate).toLocaleDateString(language)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{tx.description}</td>
                    <td className="px-4 py-3">{accountMap.get(tx.treasuryAccountId) || accountMap.get(tx.destinationAccountId || '')}</td>
                    <td className="px-4 py-3">{tx.reference || '-'}</td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        tx.financialTransactionType === 'RECETTE' ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {tx.financialTransactionType === 'RECETTE' ? '+' : '-'}
                      {formatCurrency(Number(tx.amount))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DisbursementModal
        isOpen={isDisbursementModalOpen}
        onClose={() => setIsDisbursementModalOpen(false)}
        subsidiaryId={subsidiary.id}
        sourceAccountType={accountType}
      />

      <AccountHistoryModal
        isOpen={!!historyAccount}
        onClose={() => setHistoryAccount(null)}
        account={historyAccount}
      />
    </div>
  );
};

export default TreasuryAccountTypeView;
