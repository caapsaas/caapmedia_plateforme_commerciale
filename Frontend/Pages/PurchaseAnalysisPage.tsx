import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import PeriodFilter from '../components/filters/PeriodFilter';
import PurchaseAnalysisView from '../components/analytics/PurchaseAnalysisView';
import PurchaseAnalysisViewSkeleton from '../components/analytics/PurchaseAnalysisViewSkeleton';
import { getPurchaseAnalysis, PeriodFilter as PeriodFilterType } from '../services/apiStatistic/apiAnalytics';
import { getSubsidiaries } from '../services/apiCommon/apiSubsidiaries';

// Page autonome "Analyse des achats" — extraite de l'onglet 'purchases' qui
// vivait auparavant dans Analytics.tsx, même logique que SalesAnalysisPage.
const PurchaseAnalysisPage: React.FC = () => {
    const { t } = useI18n();
    const { user } = useAuth();
    const effectiveRole = user?.activeRole ?? user?.userRole;
    const hasGlobalScope = effectiveRole === UserRole.SUPER_ADMIN || effectiveRole === UserRole.FINANCIAL_DIRECTOR;
    const [selectedSubsidiaryId, setSelectedSubsidiaryId] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilterType>('last_30_days');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const isCustomPeriodValid = selectedPeriod !== 'custom' || (!!startDate && !!endDate && startDate <= endDate);

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

    const queryParams = {
        period: selectedPeriod,
        startDate: selectedPeriod === 'custom' && startDate ? startDate : undefined,
        endDate: selectedPeriod === 'custom' && endDate ? endDate : undefined,
    };

    const effectiveSubsidiaryId = selectedSubsidiaryId || undefined;

    const { data: subsidiariesList } = useQuery({
        queryKey: ['subsidiaries'],
        queryFn: getSubsidiaries,
        enabled: hasGlobalScope,
        staleTime: 5 * 60 * 1000,
    });

    const { data: purchaseAnalysisData, isLoading } = useQuery({
        queryKey: ['purchaseAnalysis', queryParams, effectiveSubsidiaryId],
        queryFn: () => getPurchaseAnalysis(queryParams, effectiveSubsidiaryId),
        enabled: isCustomPeriodValid,
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <h1 className="text-4xl font-bold text-slate-800">{t('analytics.tabs.purchaseAnalysis')}</h1>
                <div className="flex flex-wrap items-center gap-3">
                    {hasGlobalScope && subsidiariesList && subsidiariesList.length > 0 && (
                        <select
                            value={selectedSubsidiaryId}
                            onChange={e => setSelectedSubsidiaryId(e.target.value)}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
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

            <div className="mt-6">
                {selectedPeriod === 'custom' && (!startDate || !endDate || startDate > endDate) ? (
                    <div className="p-6 text-center text-slate-500">{t('analytics.periods.selectDates')}</div>
                ) : isLoading ? (
                    <PurchaseAnalysisViewSkeleton />
                ) : purchaseAnalysisData ? (
                    <PurchaseAnalysisView data={purchaseAnalysisData} />
                ) : null}
            </div>
        </div>
    );
};

export default PurchaseAnalysisPage;
