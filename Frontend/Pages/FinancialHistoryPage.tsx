import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { TreasuryAccount, FinancialTransaction } from '../types';
import { getTreasuryAccounts, getFinancialTransactions } from '../services/apiFinance/apiTreasury';
import { isIncomeLegForSet, isExpenseLegForSet, getTransactionLegForAccount } from '../utils/transactionDisplay';
import TableSkeleton from '../components/ui/TableSkeleton';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/common/Pagination';

type HistoryTab = 'income' | 'expenses';
const PAGE_SIZE = 15;

// Page autonome "Historique Financier" — même découpage que gmo
// (FinancialHistory.tsx : onglets Recettes/Paiements), construite sur
// l'endpoint déjà existant getFinancialTransactions plutôt que sur de
// nouveaux endpoints Income/PaymentsHistory dédiés.
const FinancialHistoryPage: React.FC = () => {
    const { t, formatCurrency, language } = useI18n();
    const { subsidiary } = useAuth();
    const [activeTab, setActiveTab] = useState<HistoryTab>('income');
    const [page, setPage] = useState(1);

    const { data: accounts = [] } = useQuery<TreasuryAccount[]>({
        queryKey: ['treasuryAccounts', subsidiary?.id],
        queryFn: () => getTreasuryAccounts(subsidiary!.id),
        enabled: !!subsidiary,
    });
    const accountMap = useMemo(() => new Map(accounts.map(a => [a.id, a.accountName])), [accounts]);
    const accountIds = useMemo(() => new Set(accounts.map(a => a.id)), [accounts]);

    const { data: allTransactions = [], isLoading } = useQuery<FinancialTransaction[]>({
        queryKey: ['financialTransactions', subsidiary?.id],
        queryFn: () => getFinancialTransactions(subsidiary!.id),
        enabled: !!subsidiary,
    });

    // Un virement interne (ex: coffre → caisse dépense) est à la fois le
    // décaissement d'un compte de la filiale ET l'encaissement d'un autre —
    // il apparaît donc légitimement dans les deux onglets, chacun de son
    // point de vue (voir transactionDisplay.ts). Avant ce fix, l'onglet
    // Recettes ne montrait quasi rien : financialTransactionType vaut
    // toujours DEPENSE côté source, même pour la jambe reçue par la destination.
    const filtered = useMemo(
        () => allTransactions
            .filter(tx => activeTab === 'income' ? isIncomeLegForSet(tx, accountIds) : isExpenseLegForSet(tx, accountIds))
            .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)),
        [allTransactions, accountIds, activeTab],
    );

    const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
    const paginationMeta = {
        page,
        limit: PAGE_SIZE,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
        hasNextPage: page * PAGE_SIZE < filtered.length,
        hasPreviousPage: page > 1,
    };

    const total = filtered.reduce((sum, tx) => sum + Number(tx.amount), 0);

    if (!subsidiary) return null;

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-slate-800">{t('sidebar.financialHistory')}</h1>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">
                        {activeTab === 'income' ? t('financialHistory.incomeTab') : t('financialHistory.expensesTab')}
                    </h3>
                    <div className="flex space-x-2 p-1 bg-slate-100 rounded-lg">
                        <button
                            onClick={() => { setActiveTab('income'); setPage(1); }}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                activeTab === 'income' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {t('financialHistory.incomeTab')}
                        </button>
                        <button
                            onClick={() => { setActiveTab('expenses'); setPage(1); }}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                activeTab === 'expenses' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {t('financialHistory.expensesTab')}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-max w-full">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr className="whitespace-nowrap">
                                <th className="px-6 py-3">{t('treasury.date')}</th>
                                <th className="px-6 py-3">{t('treasury.description')}</th>
                                <th className="px-6 py-3">{t('treasury.account')}</th>
                                <th className="px-6 py-3">{t('treasury.history.counterparty')}</th>
                                <th className="px-6 py-3 text-right">{t('treasury.amount')}</th>
                                <th className="px-6 py-3 text-right">{t('treasury.history.balanceBefore')}</th>
                                <th className="px-6 py-3 text-right">{t('treasury.history.balanceAfter')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <TableSkeleton rows={8} columns={7} />
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <EmptyState icon="finance" title={t('sidebar.financialHistory')} description={t('common.notAvailable')} />
                                    </td>
                                </tr>
                            ) : paginated.map(tx => {
                                // Onglet Recettes -> le compte de la filiale concerné est le
                                // destinataire (ou treasuryAccountId pour l'ancien chemin RECETTE
                                // simple) ; onglet Dépenses -> toujours treasuryAccountId (source).
                                const matchedId = activeTab === 'income'
                                    ? (tx.destinationAccountId && accountIds.has(tx.destinationAccountId) ? tx.destinationAccountId : tx.treasuryAccountId)
                                    : tx.treasuryAccountId;
                                const { counterpartyName, balanceBefore, balanceAfter } = getTransactionLegForAccount(tx, matchedId);
                                return (
                                    <tr key={tx.id} className="bg-white border-b hover:bg-slate-50 whitespace-nowrap">
                                        <td className="px-6 py-4">{new Date(tx.transactionDate).toLocaleDateString(language)}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{tx.description}</td>
                                        <td className="px-6 py-4">{accountMap.get(matchedId) || '—'}</td>
                                        <td className="px-6 py-4">{counterpartyName}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${activeTab === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                                            {activeTab === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                                        </td>
                                        <td className="px-6 py-4 text-right">{balanceBefore != null ? formatCurrency(balanceBefore) : '—'}</td>
                                        <td className="px-6 py-4 text-right">{balanceAfter != null ? formatCurrency(balanceAfter) : '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {filtered.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-100 font-bold text-slate-800">
                                    <td colSpan={6} className="px-6 py-4 text-right">{t('common.total')}</td>
                                    <td className="px-6 py-4 text-right">{formatCurrency(total)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                    </div>
                </div>
                <Pagination meta={paginationMeta} onPageChange={setPage} />
            </div>
        </div>
    );
};

export default FinancialHistoryPage;
