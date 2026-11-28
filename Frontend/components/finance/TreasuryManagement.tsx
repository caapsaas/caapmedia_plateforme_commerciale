import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { AccountType, TreasuryAccount, UserRole, Bank } from '../../types';
import { getTreasuryAccounts } from '../../services/apiFinance/apiTreasury';
import { getBanks } from '../../services/apiFinance/apiBanks';
import AccountHistoryModal from './AccountHistoryModal';
import IconEye from '../icons/IconEye';
import EmptyState from '../ui/EmptyState';

type TreasuryTab = 'banks' | 'safes' | 'cash_registers' | 'expense_box';

const ACCOUNT_TYPE_BY_TAB: Record<TreasuryTab, AccountType> = {
  banks: AccountType.BANQUE,
  safes: AccountType.SAFE,
  cash_registers: AccountType.CASH_REGISTER,
  expense_box: AccountType.EXPENSE_BOX,
};

const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <ChevronDown className={`h-6 w-6 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
);

// Onglet "Trésorerie" de Finance & Gestion — vue consolidée de TOUS les
// comptes de trésorerie (banques regroupées par institution, coffres,
// caisses, caisses dépense), cliquables pour l'historique des transactions.
// Réservé au SUPER_ADMIN (vue globale multi-filiales), calqué sur
// Frontend_GMO/components/finance/TreasuryManagement.tsx.
const TreasuryManagement: React.FC = () => {
  const { t, formatCurrency } = useI18n();
  const { user } = useAuth();
  const activeRole = user?.activeRole ?? user?.userRole;
  const isSuperAdmin = activeRole === UserRole.SUPER_ADMIN;

  const [activeTab, setActiveTab] = useState<TreasuryTab>('banks');
  const [historyAccount, setHistoryAccount] = useState<TreasuryAccount | null>(null);
  const [openBankId, setOpenBankId] = useState<string | null>(null);

  const { data: allAccounts = [], isLoading: isLoadingAccounts } = useQuery<TreasuryAccount[]>({
    queryKey: ['treasuryAccounts', 'all'],
    queryFn: () => getTreasuryAccounts(),
    enabled: isSuperAdmin,
  });

  const { data: banks = [], isLoading: isLoadingBanks } = useQuery<Bank[]>({
    queryKey: ['banks'],
    queryFn: getBanks,
    enabled: isSuperAdmin && activeTab === 'banks',
  });

  const filteredAccounts = useMemo(
    () => allAccounts.filter((a) => a.accountType === ACCOUNT_TYPE_BY_TAB[activeTab]),
    [allAccounts, activeTab],
  );

  const banksWithAccounts = useMemo(() => {
    if (activeTab !== 'banks') return [];
    return banks.filter((bank) => filteredAccounts.some((acc) => acc.bankId === bank.id));
  }, [banks, filteredAccounts, activeTab]);

  // Comptes BANQUE non rattachés à une banque (bankId absent) — les comptes
  // créés avant l'introduction de l'entité Bank, ou saisis sans la renseigner.
  // Sans ce fallback ils disparaissaient silencieusement de l'onglet Banques.
  const unlinkedBankAccounts = useMemo(() => {
    if (activeTab !== 'banks') return [];
    return filteredAccounts.filter((acc) => !acc.bankId);
  }, [filteredAccounts, activeTab]);

  useEffect(() => {
    if (banksWithAccounts.length > 0 && openBankId === null) {
      setOpenBankId(banksWithAccounts[0].id);
    }
  }, [banksWithAccounts, openBankId]);

  const totalBalance = filteredAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
        {t('treasury.management.accessDenied')}
      </div>
    );
  }

  const AccountCard: React.FC<{ account: TreasuryAccount }> = ({ account }) => (
    <div
      onClick={() => setHistoryAccount(account)}
      className="group relative bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-2xs hover:border-[var(--border-strong)] hover:shadow-sm overflow-hidden cursor-pointer transition-all duration-200"
    >
      <div className="p-4">
        <h3 className="text-sm font-semibold text-slate-600 truncate" title={account.accountName}>{account.accountName}</h3>
        <p className="text-xl font-bold tabular-nums text-slate-900 mt-1">{formatCurrency(account.balance)}</p>
        {account.accountNumber && <p className="text-xs text-slate-400 mt-0.5 truncate">{account.accountNumber}</p>}
      </div>
      <div className="absolute inset-0 bg-slate-900/65 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-white text-sm font-medium flex items-center gap-2">
          <IconEye className="h-4 w-4" /> {t('treasury.management.viewDetails')}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-start items-center gap-4">
        <div className="flex flex-wrap gap-1 p-1 bg-[var(--muted)] border border-[var(--border)] rounded-[var(--radius-md)]">
          <button onClick={() => setActiveTab('banks')} className={`px-3.5 py-1.5 text-[13px] rounded-[var(--radius-sm)] transition-colors cursor-pointer ${activeTab === 'banks' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'font-medium text-slate-500 hover:text-slate-800'}`}>{t('analytics.tabs.banks')}</button>
          <button onClick={() => setActiveTab('safes')} className={`px-3.5 py-1.5 text-[13px] rounded-[var(--radius-sm)] transition-colors cursor-pointer ${activeTab === 'safes' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'font-medium text-slate-500 hover:text-slate-800'}`}>{t('analytics.tabs.safe')}</button>
          <button onClick={() => setActiveTab('cash_registers')} className={`px-3.5 py-1.5 text-[13px] rounded-[var(--radius-sm)] transition-colors cursor-pointer ${activeTab === 'cash_registers' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'font-medium text-slate-500 hover:text-slate-800'}`}>{t('sidebar.cashRegister')}</button>
          <button onClick={() => setActiveTab('expense_box')} className={`px-3.5 py-1.5 text-[13px] rounded-[var(--radius-sm)] transition-colors cursor-pointer ${activeTab === 'expense_box' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'font-medium text-slate-500 hover:text-slate-800'}`}>{t('expenseBoxDisbursement.title')}</button>
        </div>
      </div>

      {activeTab === 'banks' ? (
        <div className="space-y-8">
          {(isLoadingAccounts || isLoadingBanks) ? (
            <div className="bg-white rounded-xl p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-slate-100 rounded-xl p-4 animate-pulse h-28" />
                ))}
              </div>
            </div>
          ) : banksWithAccounts.length === 0 && unlinkedBankAccounts.length === 0 ? (
            <div className="py-8">
              <EmptyState icon="finance" title={t('treasury.management.noBankAccounts')} />
            </div>
          ) : (
            <>
              {banksWithAccounts.map((bank) => {
                const isOpen = openBankId === bank.id;
                const bankAccounts = filteredAccounts.filter((acc) => acc.bankId === bank.id);
                return (
                  <div key={bank.id} className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                    <button onClick={() => setOpenBankId(isOpen ? null : bank.id)} className="w-full flex justify-between items-center p-6 text-left hover:bg-slate-100 transition-colors">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[#c6e911] rounded-full" />
                        {bank.name}
                      </h3>
                      <ChevronIcon isOpen={isOpen} />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {bankAccounts.map((acc) => <AccountCard key={acc.id} account={acc} />)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {unlinkedBankAccounts.length > 0 && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
                      <span className="w-1.5 h-6 bg-slate-300 rounded-full" />
                      {t('treasury.management.unlinkedBankAccounts')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {unlinkedBankAccounts.map((acc) => <AccountCard key={acc.id} account={acc} />)}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoadingAccounts ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-slate-100 rounded-xl p-4 animate-pulse h-28" />)
          ) : filteredAccounts.length === 0 ? (
            <div className="col-span-full py-8">
              <EmptyState icon="finance" title={t('treasury.management.noAccountsForCategory')} />
            </div>
          ) : (
            filteredAccounts.map((acc) => <AccountCard key={acc.id} account={acc} />)
          )}
        </div>
      )}

      <div className="flex justify-end">
        <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <span className="text-lg font-bold text-slate-600">{t('common.total')} :</span>
          <span className="text-2xl font-bold text-[#8a9c0a]">{formatCurrency(totalBalance)}</span>
        </div>
      </div>

      <AccountHistoryModal isOpen={!!historyAccount} onClose={() => setHistoryAccount(null)} account={historyAccount} />
    </div>
  );
};

export default TreasuryManagement;
