import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../i18n';
import PeriodFilter from '../components/filters/PeriodFilter';
import DashboardView from '../components/analytics/DashboardView';
import SalesAnalysisView from '../components/analytics/SalesAnalysisView';
import PurchaseAnalysisView from '../components/analytics/PurchaseAnalysisView';
import BankView from '../components/analytics/BankView';
import SafeView from '../components/analytics/SafeView';
import { getDashboardStats, getSalesAnalysis, getPurchaseAnalysis, PeriodFilter as PeriodFilterType } from '../services/apiStatistic/apiAnalytics';

type AnalyticsView = 'dashboard' | 'sales' | 'purchases' | 'banks' | 'safe';

const Analytics: React.FC = () => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<AnalyticsView>('dashboard');
    const [selectedSubsidiaryId, setSelectedSubsidiaryId] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilterType>('LAST_30_DAYS');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const isCustomPeriodValid =selectedPeriod !== 'CUSTOM' || (!!startDate && !!endDate && startDate <= endDate);

    
    const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPeriod = e.target.value as PeriodFilterType;
        setSelectedPeriod(newPeriod);
        if (newPeriod !== 'CUSTOM') {
            setStartDate('');
            setEndDate('');
        }
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedPeriod('CUSTOM');
        setStartDate(e.target.value);
    };
    
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedPeriod('CUSTOM');
        setEndDate(e.target.value);
    };

    const queryParams = useMemo(() => ({
        period: selectedPeriod.toLowerCase(),
        startDate: selectedPeriod === 'CUSTOM' && startDate ? startDate : undefined,
        endDate: selectedPeriod === 'CUSTOM' && endDate ? endDate : undefined,
    }), [selectedPeriod, startDate, endDate]);

    // --- TanStack Query Data Fetching ---
    const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
        queryKey: ['dashboardStats', queryParams],
        queryFn: () => getDashboardStats(queryParams),
        enabled: activeTab === 'dashboard' && isCustomPeriodValid,
    });

    const { data: salesAnalysisData, isLoading: isLoadingSales } = useQuery({
        queryKey: ['salesAnalysis', queryParams],
        queryFn: () => getSalesAnalysis(queryParams),
        enabled: activeTab === 'sales' && isCustomPeriodValid,
    });

    const { data: purchaseAnalysisData, isLoading: isLoadingPurchases } = useQuery({
        queryKey: ['purchaseAnalysis', queryParams],
        queryFn: () => getPurchaseAnalysis(queryParams),
        enabled: activeTab === 'purchases' && isCustomPeriodValid,
    });

    const renderActiveView = () => {
        if (selectedPeriod === 'CUSTOM' && (!startDate || !endDate || startDate > endDate)) {
            return <div className="p-6 text-center text-slate-500">{t('analytics.periods.selectDates')}</div>;
        }
        // Only show loading if the current active tab's data is loading
        const isLoading = (activeTab === 'dashboard' && isLoadingDashboard) ||
                         (activeTab === 'sales' && isLoadingSales) ||
                         (activeTab === 'purchases' && isLoadingPurchases);
        if (isLoading) return <div>{t('common.loading')}</div>;

        switch (activeTab) {
            case 'dashboard':
                return dashboardData ? <DashboardView data={dashboardData} /> : null;
            case 'sales':
                return salesAnalysisData ? <SalesAnalysisView data={salesAnalysisData} /> : null;
            case 'purchases':
                return purchaseAnalysisData ? <PurchaseAnalysisView data={purchaseAnalysisData} /> : null;
            case 'banks':
                 // Ces vues n'ont pas encore d'API, on garde l'ancienne structure pour l'instant
                return <BankView subsidiary={{id: selectedSubsidiaryId, name: 'Dummy'}} period={selectedPeriod} startDate={startDate} endDate={endDate} />;
            case 'safe':
                return <SafeView subsidiary={{id: selectedSubsidiaryId, name: 'Dummy'}} period={selectedPeriod} startDate={startDate} endDate={endDate} />;
            default:
                return dashboardData ? <DashboardView data={dashboardData} /> : null;        }
    };

    const TABS: { view: AnalyticsView; label: string }[] = [
        { view: 'dashboard', label: t('analytics.tabs.dashboard') },
        { view: 'sales', label: t('analytics.tabs.salesAnalysis') },
        { view: 'purchases', label: t('analytics.tabs.purchaseAnalysis') },
        { view: 'banks', label: t('analytics.tabs.banks') },
        { view: 'safe', label: t('analytics.tabs.safe') },
    ];

    const TabButton: React.FC<{ view: AnalyticsView; label: string }> = ({ view, label }) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${
                activeTab === view
                    ? 'border-slate-800 text-slate-800'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <h1 className="text-4xl font-bold text-slate-800">{t('analytics.title')}</h1>
                <div className="flex items-center space-x-4">
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

            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                        <TabButton key={tab.view} view={tab.view} label={tab.label} />
                    ))}
                </nav>
            </div>
            
            <div className="mt-6">
                {renderActiveView()}
            </div>
        </div>
    );
};

export default Analytics;