import React, { useState, useMemo } from 'react';
import { FinanceView, Subsidiary, UserRole } from '../types';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getSubsidiaries } from '../services/apiCommon/apiSubsidiaries';
import { getExpenses } from '../services/apiFinance/apiExpense';
import { getPnlStatement, getBalanceSheet } from '../services/apiStatistic/apiFinanceStats';
import { getSupplierDebts } from '../services/apiFinance/apiDebts';
import { PnlStatement, BalanceSheet as BalanceSheetType } from '../services/apiStatistic/apiFinanceStats';
import { PeriodFilter } from '../services/apiStatistic/apiAnalytics';
import { ExpenseRecord, SupplierDebt } from '../types';

import CreditManagement from '../components/finance/CreditManagement';
import SupplierDebts from '../components/finance/SupplierDebts';
import ExpenseManagement from '../components/finance/ExpenseManagement';
import TreasuryManagement from '../components/finance/TreasuryManagement';
import ProfitAndLossStatement from '../components/finance/ProfitAndLossStatement';
import ExternalTransactions from '../components/finance/ExternalTransactions';
import PrefinancementManagement from '../components/finance/PrefinancementManagement';
import BalanceSheet from '../components/finance/BalanceSheet';
import TabBar, { TabItem } from '../components/ui/TabBar';
import CrmListSkeleton from '../components/ui/CrmListSkeleton';

import IconCreditCard from '../components/icons/IconCreditCard';
import IconWallet from '../components/icons/IconWallet';
import IconCoins from '../components/icons/IconCoins';
import IconTruckCoins from '../components/icons/IconTruckCoins';
import IconDocumentText from '../components/icons/IconDocumentText';
import IconCurrency from '../components/icons/IconCurrency';
import IconDocumentChartBar from '../components/icons/IconDocumentChartBar';
import IconScale from '../components/icons/IconScale';

const Finance: React.FC = () => {
    const { t } = useI18n();
    const { subsidiary, user } = useAuth();
    const [activeTab, setActiveTab] = useState<FinanceView>(FinanceView.CREDIT);
    const [subsidiaryFilter, setSubsidiaryFilter] = useState('');
    const [period, setPeriod] = useState<PeriodFilter>('this_month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const isSuperAdmin = user?.userRole === UserRole.SUPER_ADMIN || user?.activeRole === UserRole.SUPER_ADMIN;

    const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
        queryKey: ['subsidiaries-list'],
        queryFn: getSubsidiaries,
        enabled: isSuperAdmin,
    });

    const effectiveSubsidiary: Subsidiary | null = isSuperAdmin
        ? (subsidiaries.find(s => s.id === subsidiaryFilter) ?? subsidiaries[0] ?? null)
        : (subsidiary ?? null);

    const { data: expenseRecords = [], isLoading: isLoadingExpenses } = useQuery<ExpenseRecord[]>({
        queryKey: ['expenseRecords', effectiveSubsidiary?.id],
        queryFn: () => getExpenses(),
        enabled: !!effectiveSubsidiary,
    });

    const { data: supplierDebts = [], isLoading: isLoadingSupplierDebts } = useQuery<SupplierDebt[]>({
        queryKey: ['supplierDebts', effectiveSubsidiary?.id],
        queryFn: () => getSupplierDebts(),
        enabled: !!effectiveSubsidiary,
    });

    const queryParams = useMemo(() => ({
        period,
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined,
    }), [period, startDate, endDate]);

    const { data: pnlData } = useQuery<PnlStatement>({
        queryKey: ['pnlStatement', effectiveSubsidiary?.id, queryParams],
        queryFn: () => getPnlStatement(queryParams, effectiveSubsidiary!.id),
        enabled: activeTab === FinanceView.PNL && !!effectiveSubsidiary,
    });

    const { data: balanceSheetData } = useQuery<BalanceSheetType>({
        queryKey: ['balanceSheet', effectiveSubsidiary?.id],
        queryFn: () => getBalanceSheet(effectiveSubsidiary!.id),
        enabled: activeTab === FinanceView.BILAN && !!effectiveSubsidiary,
    });

    const tabs = useMemo((): TabItem<FinanceView>[] => [
        { value: FinanceView.CREDIT,                label: t('finance.creditManagement'),    icon: <IconCreditCard className="h-4 w-4" /> },
        { value: FinanceView.TREASURY,              label: t('finance.treasury'),             icon: <IconWallet className="h-4 w-4" /> },
        { value: FinanceView.PREFINANCEMENT,        label: t('finance.prefinancement'),       icon: <IconCoins className="h-4 w-4" /> },
        { value: FinanceView.SUPPLIERS,             label: t('finance.supplierDebts'),        icon: <IconTruckCoins className="h-4 w-4" /> },
        { value: FinanceView.EXPENSES,              label: t('finance.expenses'),             icon: <IconDocumentText className="h-4 w-4" /> },
        { value: FinanceView.EXTERNAL_TRANSACTIONS, label: t('finance.externalTransactions'), icon: <IconCurrency className="h-4 w-4" /> },
        { value: FinanceView.PNL,                   label: t('pnl.tabTitle'),                 icon: <IconDocumentChartBar className="h-4 w-4" /> },
        { value: FinanceView.BILAN,                 label: t('finance.bilan.tabTitle'),       icon: <IconScale className="h-4 w-4" /> },
    ], [t]);

    const renderContent = () => {
        if (!effectiveSubsidiary) return null;

        switch (activeTab) {
            case FinanceView.CREDIT:
                return <CreditManagement subsidiary={effectiveSubsidiary} />;
            case FinanceView.TREASURY:
                return <TreasuryManagement subsidiary={effectiveSubsidiary} />;
            case FinanceView.PREFINANCEMENT:
                return <PrefinancementManagement subsidiary={effectiveSubsidiary} />;
            case FinanceView.SUPPLIERS:
                return <SupplierDebts subsidiary={effectiveSubsidiary} supplierDebts={supplierDebts} isLoading={isLoadingSupplierDebts} />;
            case FinanceView.EXPENSES:
                return <ExpenseManagement subsidiary={effectiveSubsidiary} expenseRecords={expenseRecords} isLoading={isLoadingExpenses} />;
            case FinanceView.PNL:
                return (
                    <ProfitAndLossStatement
                        subsidiary={effectiveSubsidiary}
                        pnlData={pnlData}
                        period={period}
                        onPeriodChange={e => setPeriod(e.target.value as PeriodFilter)}
                        startDate={startDate}
                        onStartDateChange={e => setStartDate(e.target.value)}
                        endDate={endDate}
                        onEndDateChange={e => setEndDate(e.target.value)}
                    />
                );
            case FinanceView.BILAN:
                return <BalanceSheet subsidiary={effectiveSubsidiary} balanceSheetData={balanceSheetData} />;
            case FinanceView.EXTERNAL_TRANSACTIONS:
                return <ExternalTransactions subsidiary={effectiveSubsidiary} />;
            default:
                return <CreditManagement subsidiary={effectiveSubsidiary} />;
        }
    };

    return (
        <div className="space-y-4">
            {/* En-tête */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{t('finance.title')}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Gestion des flux, du bilan et des rapports financiers.</p>
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

            {/* Contenu */}
            {isSuperAdmin && !effectiveSubsidiary ? (
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