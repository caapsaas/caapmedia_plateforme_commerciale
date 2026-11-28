import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { UserRole, AccountType } from '../types';
import PeriodFilter from '../components/filters/PeriodFilter';
import DashboardView from '../components/analytics/DashboardView';
import TreasuryAccountsAndTransactions from '../components/analytics/TreasuryAccountsAndTransactions';
import DashboardViewSkeleton from '../components/analytics/DashboardViewSkeleton';
import { getDashboardStats, PeriodFilter as PeriodFilterType } from '../services/apiStatistic/apiAnalytics';
import { getSubsidiaries } from '../services/apiCommon/apiSubsidiaries';

// "Analyse" — Tableau de bord + suivi des comptes de trésorerie (Banque,
// Coffre-fort, Caisse, Caisse dépense). L'analyse des ventes/achats vit
// désormais dans ses propres pages (SalesAnalysisPage/PurchaseAnalysisPage),
// et le décaissement dans sa propre page (Pages/Disbursement.tsx) — même
// découpage que le sidebar gmo (dropdown "Tableau de bord" à 3 entrées,
// "Décaissement" à part).
type AnalyticsView = 'dashboard' | 'banks' | 'safe' | 'cash' | 'expenseBox';

const Analytics: React.FC = () => {
    const { t } = useI18n();
    const { user, subsidiary } = useAuth();
    const effectiveRole = user?.activeRole ?? user?.userRole;
    const hasGlobalScope = effectiveRole === UserRole.SUPER_ADMIN || effectiveRole === UserRole.FINANCIAL_DIRECTOR;
    const [activeTab, setActiveTab] = useState<AnalyticsView>('dashboard');
    const [selectedSubsidiaryId, setSelectedSubsidiaryId] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilterType>('last_30_days');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const isCustomPeriodValid =selectedPeriod !== 'custom' || (!!startDate && !!endDate && startDate <= endDate);


    const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPeriod = e.target.value as PeriodFilterType;
        setSelectedPeriod(newPeriod);
        if (newPeriod !== 'custom') {
            setStartDate('');
            setEndDate('');
        }
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedPeriod('custom');
        setStartDate(e.target.value);
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedPeriod('custom');
        setEndDate(e.target.value);
    };

    const queryParams = useMemo(() => ({
        period: selectedPeriod,
        startDate: selectedPeriod === 'custom' && startDate ? startDate : undefined,
        endDate: selectedPeriod === 'custom' && endDate ? endDate : undefined,
    }), [selectedPeriod, startDate, endDate]);

    const effectiveSubsidiaryId = selectedSubsidiaryId || undefined;

    // --- TanStack Query Data Fetching ---
    const { data: subsidiariesList } = useQuery({
        queryKey: ['subsidiaries'],
        queryFn: getSubsidiaries,
        enabled: hasGlobalScope,
        staleTime: 5 * 60 * 1000,
    });

    const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
        queryKey: ['dashboardStats', queryParams, effectiveSubsidiaryId],
        queryFn: () => getDashboardStats(queryParams, effectiveSubsidiaryId),
        enabled: activeTab === 'dashboard' && isCustomPeriodValid,
    });

    const renderActiveView = () => {
        if (selectedPeriod === 'custom' && (!startDate || !endDate || startDate > endDate)) {
            return <div className="p-6 text-center text-slate-500">{t('analytics.periods.selectDates')}</div>;
        }
        if (activeTab === 'dashboard' && isLoadingDashboard) return <DashboardViewSkeleton />;

        if (!subsidiary) return null;

        switch (activeTab) {
            case 'dashboard':
                return dashboardData ? <DashboardView data={dashboardData} /> : null;
            case 'banks':
                return <TreasuryAccountsAndTransactions subsidiary={subsidiary} accountType={AccountType.BANQUE} title={t('analytics.tabs.banks')} period={selectedPeriod} startDate={startDate || undefined} endDate={endDate || undefined} />;
            case 'safe':
                return <TreasuryAccountsAndTransactions subsidiary={subsidiary} accountType={AccountType.SAFE} title={t('analytics.tabs.safe')} period={selectedPeriod} startDate={startDate || undefined} endDate={endDate || undefined} />;
            case 'cash':
                // CAISSE a été fusionnée dans CASH_REGISTER (aucune différence
                // fonctionnelle entre les deux types, voir AccountType).
                return <TreasuryAccountsAndTransactions subsidiary={subsidiary} accountType={AccountType.CASH_REGISTER} title={t('analytics.tabs.cash')} period={selectedPeriod} startDate={startDate || undefined} endDate={endDate || undefined} />;
            case 'expenseBox':
                return <TreasuryAccountsAndTransactions subsidiary={subsidiary} accountType={AccountType.EXPENSE_BOX} title={t('analytics.tabs.expenseBox')} period={selectedPeriod} startDate={startDate || undefined} endDate={endDate || undefined} />;
            default:
                return dashboardData ? <DashboardView data={dashboardData} /> : null;
        }
    };

    const TABS: { view: AnalyticsView; label: string }[] = [
        { view: 'dashboard', label: t('analytics.tabs.dashboard') },
        { view: 'banks', label: t('analytics.tabs.banks') },
        { view: 'safe', label: t('analytics.tabs.safe') },
        { view: 'cash', label: t('analytics.tabs.cash') },
        { view: 'expenseBox', label: t('analytics.tabs.expenseBox') },
    ];

    const TabButton: React.FC<{ view: AnalyticsView; label: string }> = ({ view, label }) => {
        const isActive = activeTab === view;
        return (
            <button
                type="button"
                onClick={() => setActiveTab(view)}
                className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-[var(--radius-sm)] text-[13px] cursor-pointer transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                    isActive
                        ? 'bg-[var(--brand)] text-[var(--brand-foreground)] font-semibold shadow-2xs'
                        : 'font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/80'
                }`}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('analytics.title')}</h1>
                <div className="flex flex-wrap items-center gap-3">
                    {hasGlobalScope && subsidiariesList && subsidiariesList.length > 0 && (
                        <select
                            value={selectedSubsidiaryId}
                            onChange={e => setSelectedSubsidiaryId(e.target.value)}
                            className="h-9 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white pl-3 pr-9 text-sm text-slate-700 shadow-2xs cursor-pointer hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6e911]/40 focus:border-slate-400"
                        >
                            <option value="">{t('analytics.allSubsidiaries')}</option>
                            {subsidiariesList.map(s => (
                                <option key={s.id} value={s.id}>{s.subsidiaryName}</option>
                            ))}
                        </select>
                    )}
                    <PeriodFilter
                        period={selectedPeriod}
                        onPeriodChange={handlePeriodChange}
                        startDate={startDate}
                        onStartDateChange={handleStartDateChange}
                        endDate={endDate}
                        onEndDateChange={handleEndDateChange}
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-[var(--muted)] border border-[var(--border)] rounded-[var(--radius-md)]" role="tablist" aria-label="Tabs">
                {TABS.map(tab => (
                    <TabButton key={tab.view} view={tab.view} label={tab.label} />
                ))}
            </div>

            <div className="mt-6">
                {renderActiveView()}
            </div>
        </div>
    );
};

export default Analytics;
