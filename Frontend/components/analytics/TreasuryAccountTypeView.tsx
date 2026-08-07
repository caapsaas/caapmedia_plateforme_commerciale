import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  History,
  RefreshCw,
  ShoppingCart,
  Users,
  Gift,
  FileText,
  Home,
  Zap,
  Megaphone,
  Package,
  ShoppingBag,
  MoreHorizontal,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Banknote,
  Landmark,
  Wallet,
} from 'lucide-react';
import { TreasuryAccount, FinancialTransaction, AccountType, TreasuryTransactionType } from '../../types';
import { useI18n } from '../../i18n';
import { PeriodFilter } from '../../services/apiStatistic/apiAnalytics';
import { resolvePeriodBounds } from '../../utils/periodBounds';
import { getTreasuryAccounts, getFinancialTransactions } from '../../services/apiFinance/apiTreasury';
import { getTransactionLegForAccount } from '../../utils/transactionDisplay';
import Pagination from '../common/Pagination';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';

interface TreasuryAccountTypeViewProps {
  accountType: AccountType;
  title: string;
  subtitle: string;
  period: PeriodFilter;
  startDate?: string;
  endDate?: string;
  // Coffre-fort et Banque sont centralisés au siège (voir
  // TreasuryService.createAccount) : pas de filtre filiale ici, le
  // SUPER_ADMIN a une vue globale sur ces comptes.
  renderDisbursementModal: (props: { isOpen: boolean; onClose: () => void }) => React.ReactNode;
}

const PAGE_SIZE = 10;

const TYPE_ICON: Record<TreasuryTransactionType, React.ComponentType<{ className?: string }>> = {
  [TreasuryTransactionType.INFLOW]: TrendingUp,
  [TreasuryTransactionType.OUTFLOW]: TrendingDown,
  [TreasuryTransactionType.BANK_WITHDRAWAL]: CreditCard,
  [TreasuryTransactionType.CASH_REFILL]: DollarSign,
  [TreasuryTransactionType.SUPPLIER_PAYMENT]: ShoppingCart,
  [TreasuryTransactionType.SALARY_PAYMENT]: Users,
  [TreasuryTransactionType.BONUS_PAYMENT]: Gift,
  [TreasuryTransactionType.TAX_PAYMENT]: FileText,
  [TreasuryTransactionType.IRPP_PAYMENT]: FileText,
  [TreasuryTransactionType.CNPS_PAYMENT]: FileText,
  [TreasuryTransactionType.CFC_FNE_PAYMENT]: FileText,
  [TreasuryTransactionType.TVA_PAYMENT]: FileText,
  [TreasuryTransactionType.RENT]: Home,
  [TreasuryTransactionType.UTILITIES]: Zap,
  [TreasuryTransactionType.MARKETING]: Megaphone,
  [TreasuryTransactionType.SUPPLIES]: Package,
  [TreasuryTransactionType.PURCHASE_COST]: ShoppingBag,
  [TreasuryTransactionType.OTHER_EXPENSE]: MoreHorizontal,
};

const TYPE_BADGE_CLASS: Record<TreasuryTransactionType, string> = {
  [TreasuryTransactionType.INFLOW]: 'bg-green-50 text-green-700 border border-green-200',
  [TreasuryTransactionType.OUTFLOW]: 'bg-slate-100 text-slate-700 border border-slate-200',
  [TreasuryTransactionType.BANK_WITHDRAWAL]: 'bg-blue-50 text-blue-700 border border-blue-200',
  [TreasuryTransactionType.CASH_REFILL]: 'bg-blue-50 text-blue-700 border border-blue-200',
  [TreasuryTransactionType.SUPPLIER_PAYMENT]: 'bg-red-50 text-red-700 border border-red-200',
  [TreasuryTransactionType.SALARY_PAYMENT]: 'bg-purple-50 text-purple-700 border border-purple-200',
  [TreasuryTransactionType.BONUS_PAYMENT]: 'bg-purple-50 text-purple-700 border border-purple-200',
  [TreasuryTransactionType.TAX_PAYMENT]: 'bg-red-50 text-red-700 border border-red-200',
  [TreasuryTransactionType.IRPP_PAYMENT]: 'bg-red-50 text-red-700 border border-red-200',
  [TreasuryTransactionType.CNPS_PAYMENT]: 'bg-red-50 text-red-700 border border-red-200',
  [TreasuryTransactionType.CFC_FNE_PAYMENT]: 'bg-red-50 text-red-700 border border-red-200',
  [TreasuryTransactionType.TVA_PAYMENT]: 'bg-red-50 text-red-700 border border-red-200',
  [TreasuryTransactionType.RENT]: 'bg-red-50 text-red-700 border border-red-200',
  [TreasuryTransactionType.UTILITIES]: 'bg-red-50 text-red-700 border border-red-200',
  [TreasuryTransactionType.MARKETING]: 'bg-red-50 text-red-700 border border-red-200',
  [TreasuryTransactionType.SUPPLIES]: 'bg-red-50 text-red-700 border border-red-200',
  [TreasuryTransactionType.PURCHASE_COST]: 'bg-red-50 text-red-700 border border-red-200',
  [TreasuryTransactionType.OTHER_EXPENSE]: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const HEADER_ICON: Partial<Record<AccountType, React.ComponentType<{ className?: string }>>> = {
  [AccountType.BANQUE]: Landmark,
  [AccountType.SAFE]: Wallet,
};

// Vue "Décaissement" par type de compte de trésorerie (Coffre-fort, Banque) —
// calquée sur Frontend_GMO/components/analytics/{Bank,Safe}View.tsx : en-tête
// dégradé + bouton décaissement, puis UNIQUEMENT l'historique des
// transactions (tableau paginé, badges par type de mouvement). La liste des
// comptes cliquables pour l'historique par compte est dans Finance & Gestion
// → onglet Trésorerie (voir TreasuryManagement.tsx), pas ici — même
// séparation que gmo (DisbursementPage vs Finance.tsx::treasury).
const TreasuryAccountTypeView: React.FC<TreasuryAccountTypeViewProps> = ({
  accountType,
  title,
  subtitle,
  period,
  startDate,
  endDate,
  renderDisbursementModal,
}) => {
  const { t, formatCurrency, language } = useI18n();
  const [isDisbursementModalOpen, setIsDisbursementModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: allAccounts = [], isLoading: isLoadingAccounts } = useQuery<TreasuryAccount[]>({
    queryKey: ['treasuryAccounts', 'all'],
    queryFn: () => getTreasuryAccounts(),
  });

  const accounts = useMemo(
    () => allAccounts.filter((a) => a.accountType === accountType),
    [allAccounts, accountType],
  );
  const accountIds = useMemo(() => new Set(accounts.map((a) => a.id)), [accounts]);

  const { data: allTransactions = [], isLoading: isLoadingTx } = useQuery<FinancialTransaction[]>({
    queryKey: ['financialTransactions', 'all'],
    queryFn: () => getFinancialTransactions(),
    enabled: accounts.length > 0,
  });

  const { start: periodStart, end: periodEnd } = useMemo(
    () => resolvePeriodBounds(period, startDate, endDate),
    [period, startDate, endDate],
  );

  const transactions = useMemo(() => {
    return allTransactions
      .filter((tx) => accountIds.has(tx.sourceAccountId || tx.treasuryAccountId))
      .filter((tx) => {
        if (!periodStart && !periodEnd) return true;
        const txDate = tx.transactionDate.slice(0, 10);
        if (periodStart && txDate < periodStart) return false;
        if (periodEnd && txDate > periodEnd) return false;
        return true;
      })
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
  }, [allTransactions, accountIds, periodStart, periodEnd]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const paginated = transactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const paginationMeta = {
    page: currentPage,
    limit: PAGE_SIZE,
    total: transactions.length,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };

  const HeaderIcon = HEADER_ICON[accountType] ?? Banknote;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-[#c6e911]/20 to-white p-6 rounded-xl border border-[#c6e911]/40 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HeaderIcon className="w-6 h-6 text-[#8a9c0a]" />
            {title}
          </h3>
          <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
        </div>
        <button
          onClick={() => setIsDisbursementModalOpen(true)}
          disabled={isLoadingAccounts || accounts.length === 0}
          className="mt-4 sm:mt-0 bg-[#231F20] hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          {t('treasuryAccounts.view.disbursement')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h4 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            {t('treasuryAccounts.view.movementsSection')}
          </h4>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-max w-full">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr className="whitespace-nowrap">
                <th className="px-4 py-3 whitespace-nowrap">{t('treasury.history.reference')}</th>
                <th className="px-4 py-3 whitespace-nowrap">{t('treasury.date')}</th>
                <th className="px-4 py-3 whitespace-nowrap">{t('treasury.description')}</th>
                <th className="px-4 py-3 whitespace-nowrap">{t('treasury.history.counterparty')}</th>
                <th className="px-4 py-3 whitespace-nowrap">{t('treasuryAccounts.view.type')}</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">{t('treasury.amount')}</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">{t('treasury.history.balanceBefore')}</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">{t('treasury.history.balanceAfter')}</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">{t('treasuryAccounts.view.statusColumn')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingAccounts || isLoadingTx ? (
                <TableSkeleton rows={5} columns={9} />
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState icon="finance" title={t('treasuryAccounts.view.movementsSection')} description={t('common.notAvailable')} />
                  </td>
                </tr>
              ) : (
                paginated.map((tx) => {
                  const TypeIcon = tx.treasuryType ? TYPE_ICON[tx.treasuryType] : Banknote;
                  const badgeClass = tx.treasuryType ? TYPE_BADGE_CLASS[tx.treasuryType] : 'bg-slate-100 text-slate-700 border border-slate-200';
                  // Cette vue ne liste que des décaissements (transactions dont
                  // la source appartient à cet ensemble de comptes) : le compte
                  // concerné est toujours treasuryAccountId.
                  const { counterpartyName, balanceBefore, balanceAfter } = getTransactionLegForAccount(tx, tx.treasuryAccountId);
                  return (
                    <tr key={tx.id} className="bg-white border-b hover:bg-slate-50 transition-colors whitespace-nowrap">
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{tx.reference || tx.id.slice(0, 12)}</td>
                      <td className="px-4 py-3">{new Date(tx.transactionDate).toLocaleDateString(language)}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{tx.description}</td>
                      <td className="px-4 py-3">{counterpartyName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${badgeClass}`}>
                          <TypeIcon className="w-3.5 h-3.5" />
                          {tx.treasuryType ? t(`safeDisbursement.types.${tx.treasuryType}`) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold whitespace-nowrap text-red-600">
                        -{formatCurrency(Number(tx.amount))}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{balanceBefore != null ? formatCurrency(balanceBefore) : '—'}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{balanceAfter != null ? formatCurrency(balanceAfter) : '—'}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${tx.status === 'EN_ATTENTE' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                          {tx.status === 'EN_ATTENTE' ? t('treasury.statusPending') : t('treasury.statusValidated')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
        {transactions.length > 0 && (
          <div className="px-2">
            <Pagination meta={paginationMeta} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      {renderDisbursementModal({
        isOpen: isDisbursementModalOpen,
        onClose: () => setIsDisbursementModalOpen(false),
      })}
    </div>
  );
};

export default TreasuryAccountTypeView;
