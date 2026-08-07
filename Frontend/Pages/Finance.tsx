import React, { useState } from 'react';
import { FinanceView, Subsidiary, UserRole } from '../types';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getSubsidiaries } from '../services/apiCommon/apiSubsidiaries';
import { getExpenses } from '../services/apiFinance/apiExpense';
import { getSupplierDebts, getLongTermDebts } from '../services/apiFinance/apiDebts';
import { getRecurringExpenses } from '../services/apiFinance/apiRecurringExpenses';
import { ExpenseRecord, SupplierDebt, LongTermDebt, RecurringExpense } from '../types';

import SupplierDebts from '../components/finance/SupplierDebts';
import LongTermDebts from '../components/finance/LongTermDebts';
import ExpenseManagement from '../components/finance/ExpenseManagement';
import RecurringExpenses from '../components/finance/RecurringExpenses';
import TaxTransparencyView from '../components/finance/TaxTransparencyView';
import ExternalTransactions from '../components/finance/ExternalTransactions';
import PrefinancementManagement from '../components/finance/PrefinancementManagement';
import ExpenseBoxView from '../components/finance/ExpenseBoxView';
import CashRemittanceManagement from '../components/finance/CashRemittanceManagement';
import TreasuryManagement from '../components/finance/TreasuryManagement';
import PendingTransactionsPanel from '../components/finance/PendingTransactionsPanel';
import TabBar, { TabItem } from '../components/ui/TabBar';
import CrmListSkeleton from '../components/ui/CrmListSkeleton';

import IconCoins from '../components/icons/IconCoins';
import IconTruckCoins from '../components/icons/IconTruckCoins';
import IconDocumentText from '../components/icons/IconDocumentText';
import IconCurrency from '../components/icons/IconCurrency';
import IconScale from '../components/icons/IconScale';
import IconWallet from '../components/icons/IconWallet';
import IconCash from '../components/icons/IconCash';
import IconFinance from '../components/icons/IconFinance';

// Trésorerie/Décaissement, Créances Clients et rapports Bilan/Compte de
// résultat sont désormais des pages autonomes du sidebar (Analyse,
// Décaissement, Créances Clients — voir Pages/Disbursement.tsx,
// Pages/CreditHistoryPage.tsx) : retirés d'ici pour ne pas dupliquer le même
// contenu à deux endroits.
const Finance: React.FC = () => {
    const { t } = useI18n();
    const { subsidiary, user } = useAuth();
    const activeRole = user?.activeRole ?? user?.userRole;
    // Le CAISSIER n'a accès qu'aux remises de caisse (voir CashRemittanceManagement) —
    // même logique de restriction par onglet que gmo (components/Finance.tsx::availableTabs).
    const isCaissier = activeRole === UserRole.CAISSIER;
    const [activeTab, setActiveTab] = useState<FinanceView>(
        isCaissier ? FinanceView.CASH_REMITTANCES : FinanceView.SUPPLIERS,
    );
    const [subsidiaryFilter, setSubsidiaryFilter] = useState('');

    // activeRole prime sur userRole (apercu de role SUPER_ADMIN, voir Purchasing.tsx pour le meme correctif).
    const isSuperAdmin = (user?.activeRole ?? user?.userRole) === UserRole.SUPER_ADMIN;

    const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
        queryKey: ['subsidiaries-list'],
        queryFn: getSubsidiaries,
        enabled: isSuperAdmin,
    });

    const effectiveSubsidiary: Subsidiary | null = isSuperAdmin
        ? (subsidiaries.find(s => s.id === subsidiaryFilter) ?? subsidiaries[0] ?? null)
        : (subsidiary ?? null);

    // Dettes fournisseur : contrairement aux autres onglets (qui exigent une
    // filiale précise), le SUPER_ADMIN doit pouvoir voir une vue consolidée
    // "Toutes les filiales" — sinon le sélecteur retombe silencieusement sur
    // subsidiaries[0] et les dettes (payées ou non) des autres filiales
    // semblent "ne jamais s'afficher". `null` = consolidé, voir SupplierDebts.tsx.
    const supplierDebtsSubsidiary: Subsidiary | null =
        isSuperAdmin && !subsidiaryFilter ? null : effectiveSubsidiary;

    // Le CAISSIER n'a droit qu'aux remises de caisse — pas la peine de charger
    // le reste (endpoints de toute façon inaccessibles à ce rôle).
    const { data: expenseRecords = [], isLoading: isLoadingExpenses } = useQuery<ExpenseRecord[]>({
        queryKey: ['expenseRecords', effectiveSubsidiary?.id],
        queryFn: () => getExpenses(),
        enabled: !!effectiveSubsidiary && !isCaissier,
    });

    const { data: supplierDebts = [], isLoading: isLoadingSupplierDebts } = useQuery<SupplierDebt[]>({
        queryKey: ['supplierDebts', effectiveSubsidiary?.id],
        queryFn: () => getSupplierDebts(),
        enabled: !!effectiveSubsidiary && !isCaissier,
    });

    const { data: longTermDebts = [], isLoading: isLoadingLongTermDebts } = useQuery<LongTermDebt[]>({
        queryKey: ['longTermDebts', effectiveSubsidiary?.id],
        queryFn: () => getLongTermDebts(),
        enabled: !!effectiveSubsidiary && !isCaissier,
    });

    const { data: recurringExpenses = [], isLoading: isLoadingRecurringExpenses } = useQuery<RecurringExpense[]>({
        queryKey: ['recurringExpenses', effectiveSubsidiary?.id],
        queryFn: () => getRecurringExpenses(),
        enabled: !!effectiveSubsidiary && !isCaissier,
    });

    const allTabs: TabItem<FinanceView>[] = [
        { value: FinanceView.SUPPLIERS,             label: t('finance.supplierDebts'),        icon: <IconTruckCoins className="h-4 w-4" /> },
        { value: FinanceView.LONG_TERM_DEBTS,       label: t('supplierDebts.longTerm.tabTitle'), icon: <IconTruckCoins className="h-4 w-4" /> },
        { value: FinanceView.PREFINANCEMENT,        label: t('finance.prefinancement'),       icon: <IconCoins className="h-4 w-4" /> },
        // Trésorerie (comptes cliquables pour l'historique) : réservée au
        // SUPER_ADMIN — vue consolidée multi-filiales, comme gmo
        // (Finance.tsx::treasury, restreint au siège).
        ...(isSuperAdmin ? [{ value: FinanceView.TREASURY, label: t('treasury.management.title'), icon: <IconFinance className="h-4 w-4" /> }] : []),
        { value: FinanceView.EXPENSE_BOX,           label: t('expenseBoxDisbursement.title'), icon: <IconWallet className="h-4 w-4" /> },
        { value: FinanceView.CASH_REMITTANCES,      label: t('cashRemittance.title'),         icon: <IconCash className="h-4 w-4" /> },
        { value: FinanceView.EXPENSES,              label: t('finance.expenses'),             icon: <IconDocumentText className="h-4 w-4" /> },
        { value: FinanceView.RECURRING_EXPENSES,    label: t('recurringExpenses.title'),      icon: <IconDocumentText className="h-4 w-4" /> },
        { value: FinanceView.TAX_TRANSPARENCY,      label: t('taxTransparency.title'),        icon: <IconScale className="h-4 w-4" /> },
        { value: FinanceView.EXTERNAL_TRANSACTIONS, label: t('finance.externalTransactions'), icon: <IconCurrency className="h-4 w-4" /> },
    ];

    // Le CAISSIER ne voit que les remises de caisse, comme sur gmo.
    const tabs = isCaissier
        ? allTabs.filter(tab => tab.value === FinanceView.CASH_REMITTANCES)
        : allTabs;

    const renderContent = () => {
        // Trésorerie est une vue globale (comptes centralisés au siège pour
        // Banque/Coffre) — ne dépend pas de la filiale sélectionnée.
        if (activeTab === FinanceView.TREASURY) return <TreasuryManagement />;
        if (!effectiveSubsidiary) return null;

        switch (activeTab) {
            case FinanceView.SUPPLIERS:
                return <SupplierDebts subsidiary={supplierDebtsSubsidiary} supplierDebts={supplierDebts} isLoading={isLoadingSupplierDebts} />;
            case FinanceView.LONG_TERM_DEBTS:
                return <LongTermDebts subsidiary={effectiveSubsidiary} longTermDebts={longTermDebts} isLoading={isLoadingLongTermDebts} />;
            case FinanceView.PREFINANCEMENT:
                return <PrefinancementManagement subsidiary={effectiveSubsidiary} />;
            case FinanceView.EXPENSE_BOX:
                return <ExpenseBoxView subsidiary={effectiveSubsidiary} />;
            case FinanceView.CASH_REMITTANCES:
                return <CashRemittanceManagement />;
            case FinanceView.EXPENSES:
                return <ExpenseManagement subsidiary={effectiveSubsidiary} expenseRecords={expenseRecords} isLoading={isLoadingExpenses} />;
            case FinanceView.RECURRING_EXPENSES:
                return <RecurringExpenses subsidiary={effectiveSubsidiary} recurringExpenses={recurringExpenses} isLoading={isLoadingRecurringExpenses} />;
            case FinanceView.TAX_TRANSPARENCY:
                return <TaxTransparencyView subsidiary={effectiveSubsidiary} />;
            case FinanceView.EXTERNAL_TRANSACTIONS:
                return <ExternalTransactions subsidiary={effectiveSubsidiary} />;
            default:
                return <SupplierDebts subsidiary={supplierDebtsSubsidiary} supplierDebts={supplierDebts} isLoading={isLoadingSupplierDebts} />;
        }
    };

    return (
        <div className="space-y-4">
            {/* En-tête */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{t('finance.title')}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Gestion des charges, dettes et rapports fiscaux.</p>
                </div>
                {isSuperAdmin && subsidiaries.length > 0 && (
                    <select
                        value={subsidiaryFilter}
                        onChange={e => setSubsidiaryFilter(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                    >
                        <option value="">Toutes les filiales</option>
                        {subsidiaries.map(s => (
                            <option key={s.id} value={s.id}>{s.subsidiaryName}</option>
                        ))}
                    </select>
                )}
            </div>

            <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

            {/* Panel de validation des paiements bancaires (SUPER_ADMIN uniquement) */}
            {isSuperAdmin && (
                <PendingTransactionsPanel subsidiaryId={subsidiaryFilter || undefined} />
            )}

            {/* Contenu */}
            {activeTab === FinanceView.TREASURY ? (
                renderContent()
            ) : isSuperAdmin && !effectiveSubsidiary ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-xl text-center">
                    <IconScale className="h-8 w-8 text-slate-300 mb-3" />
                    <p className="text-sm font-semibold text-slate-500">Sélectionnez une filiale</p>
                    <p className="text-xs text-slate-400 mt-1">Choisissez une filiale pour consulter ses données financières.</p>
                    {subsidiaries.length > 0 && (
                        <select
                            value={subsidiaryFilter}
                            onChange={e => setSubsidiaryFilter(e.target.value)}
                            className="mt-4 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                        >
                            <option value="">Toutes les filiales</option>
                            {subsidiaries.map(s => (
                                <option key={s.id} value={s.id}>{s.subsidiaryName}</option>
                            ))}
                        </select>
                    )}
                </div>
            ) : !effectiveSubsidiary ? (
                <CrmListSkeleton columns={5} />
            ) : (
                renderContent()
            )}
        </div>
    );
};

export default Finance;
