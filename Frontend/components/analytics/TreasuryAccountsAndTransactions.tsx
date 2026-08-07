import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Subsidiary, TreasuryAccount, FinancialTransaction, AccountType } from '../../types';
import { useI18n } from '../../i18n';
import { PeriodFilter } from '../../services/apiStatistic/apiAnalytics';
import { resolvePeriodBounds } from '../../utils/periodBounds';
import { getTreasuryAccounts, getFinancialTransactions } from '../../services/apiFinance/apiTreasury';
import { findAccountIdInSet, getTransactionLegForAccount } from '../../utils/transactionDisplay';
import TreasuryStatementModal from '../finance/TreasuryStatementModal';
import IconPrint from '../icons/IconPrint';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import Pagination from '../common/Pagination';

interface TreasuryAccountsAndTransactionsProps {
  subsidiary: Subsidiary;
  accountType: AccountType;
  title: string;
  period: PeriodFilter;
  startDate?: string;
  endDate?: string;
}

const PAGE_SIZE = 15;

// Double sous-onglet "Comptes" / "Transactions" par type de compte de
// trésorerie, pour l'onglet Analyse (Analytics.tsx) — même structure que
// gmo (finance/BankList.tsx, finance/SafeManagement.tsx) : la vue Comptes
// liste les comptes avec un bouton "Relevé" par ligne (export PDF sur une
// période choisie), la vue Transactions liste tous les mouvements. Pas de
// bouton décaissement ici — c'est le rôle de la page autonome Décaissement
// (voir TreasuryAccountTypeView.tsx / Pages/Disbursement.tsx).
const TreasuryAccountsAndTransactions: React.FC<TreasuryAccountsAndTransactionsProps> = ({
  subsidiary,
  accountType,
  title,
  period,
  startDate,
  endDate,
}) => {
  const { t, formatCurrency, language } = useI18n();
  const [subTab, setSubTab] = useState<'accounts' | 'transactions'>('accounts');
  const [statementAccount, setStatementAccount] = useState<TreasuryAccount | null>(null);
  const [page, setPage] = useState(1);

  const { data: allAccounts = [], isLoading: isLoadingAccounts } = useQuery<TreasuryAccount[]>({
    queryKey: ['treasuryAccounts', subsidiary.id],
    queryFn: () => getTreasuryAccounts(subsidiary.id),
  });

  const accounts = useMemo(
    () => allAccounts.filter((a) => a.accountType === accountType),
    [allAccounts, accountType],
  );
  const accountIds = useMemo(() => new Set(accounts.map((a) => a.id)), [accounts]);

  const { data: allTransactions = [], isLoading: isLoadingTx } = useQuery<FinancialTransaction[]>({
    queryKey: ['financialTransactions', subsidiary.id],
    queryFn: () => getFinancialTransactions(subsidiary.id),
    enabled: subTab === 'transactions' && accounts.length > 0,
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

  const paginatedTransactions = useMemo(
    () => transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [transactions, page],
  );
  const paginationMeta = {
    page,
    limit: PAGE_SIZE,
    total: transactions.length,
    totalPages: Math.max(1, Math.ceil(transactions.length / PAGE_SIZE)),
    hasNextPage: page * PAGE_SIZE < transactions.length,
    hasPreviousPage: page > 1,
  };

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
      <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
          <div className="flex space-x-2 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setSubTab('accounts')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                subTab === 'accounts' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {title}
            </button>
            <button
              onClick={() => { setSubTab('transactions'); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                subTab === 'transactions' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('sidebar.transactions')}
            </button>
          </div>
        </div>

        {subTab === 'accounts' ? (
          accounts.length === 0 ? (
            <EmptyState icon="finance" title={title} description={t('common.notAvailable')} />
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-max w-full">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr className="whitespace-nowrap">
                    <th className="px-4 py-3">{t('treasuryAccounts.table.accountName')}</th>
                    <th className="px-4 py-3">{t('treasury.statement.period')}</th>
                    <th className="px-4 py-3 text-right">{t('treasuryAccounts.table.balance')}</th>
                    <th className="px-4 py-3 text-center no-print">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="bg-white border-b hover:bg-slate-50 whitespace-nowrap">
                      <td className="px-4 py-3 font-medium text-slate-800">{acc.accountName}</td>
                      <td className="px-4 py-3">{acc.accountNumber || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(acc.balance)}</td>
                      <td className="px-4 py-3 text-center no-print">
                        <button
                          onClick={() => setStatementAccount(acc)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                          title={t('treasury.statement.title')}
                        >
                          <IconPrint className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-max w-full">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr className="whitespace-nowrap">
                    <th className="px-4 py-3">{t('treasury.date')}</th>
                    <th className="px-4 py-3">{t('treasury.description')}</th>
                    <th className="px-4 py-3">{t('treasury.history.direction')}</th>
                    <th className="px-4 py-3">{t('treasury.history.counterparty')}</th>
                    <th className="px-4 py-3">{t('treasury.history.reference')}</th>
                    <th className="px-4 py-3 text-right">{t('treasury.amount')}</th>
                    <th className="px-4 py-3 text-right">{t('treasury.history.balanceBefore')}</th>
                    <th className="px-4 py-3 text-right">{t('treasury.history.balanceAfter')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingTx ? (
                    <TableSkeleton rows={5} columns={8} />
                  ) : paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState icon="finance" title={t('sidebar.transactions')} description={t('common.notAvailable')} />
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((tx) => {
                      // Un même virement peut être décaissement pour un compte
                      // de l'ensemble et encaissement pour un autre : on résout
                      // le compte de CET ensemble concerné par la ligne (le
                      // côté destinataire est prioritaire s'il en fait partie).
                      const matchedId = findAccountIdInSet(tx, accountIds) ?? tx.treasuryAccountId;
                      const { isIncome, counterpartyName, balanceBefore, balanceAfter } = getTransactionLegForAccount(tx, matchedId);
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
                          <td className="px-4 py-3">{tx.reference || '-'}</td>
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
            <Pagination meta={paginationMeta} onPageChange={setPage} />
          </>
        )}
      </div>

      <TreasuryStatementModal
        isOpen={!!statementAccount}
        onClose={() => setStatementAccount(null)}
        account={statementAccount}
      />
    </div>
  );
};

export default TreasuryAccountsAndTransactions;
