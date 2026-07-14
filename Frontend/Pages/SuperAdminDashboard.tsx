import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../i18n';
import PeriodFilter from '../components/filters/PeriodFilter';
import DashboardView from '../components/analytics/DashboardView';
import { getDashboardStats, PeriodFilter as PeriodFilterType, PeriodFilterDto } from '../services/apiStatistic/apiAnalytics';
import { getSubsidiaries } from '../services/apiCommon/apiSubsidiaries';

/**
 * Dashboard consolide reserve a SUPER_ADMIN. Sans filiale selectionnee, les
 * chiffres sont agreges sur toutes les filiales (scope global resolu cote
 * backend, voir subsidiary-scope.ts). La selection d'une filiale fait un
 * drill-down sur ses seules donnees.
 */
const SuperAdminDashboard: React.FC = () => {
  const { t } = useI18n();
  const [selectedSubsidiaryId, setSelectedSubsidiaryId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilterType>('LAST_30_DAYS');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isCustomPeriodValid = selectedPeriod !== 'CUSTOM' || (!!startDate && !!endDate && startDate <= endDate);

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

  const { data: subsidiaries } = useQuery({
    queryKey: ['subsidiaries'],
    queryFn: getSubsidiaries,
  });

  const queryParams: PeriodFilterDto = {
    // Le type PeriodFilterDto.period est mal declare en majuscules dans apiAnalytics.ts,
    // le backend attend en realite des valeurs minuscules (voir period-filter.dto.ts) -
    // meme pattern deja utilise (et fonctionnel) dans Pages/Analytics.tsx.
    period: selectedPeriod.toLowerCase() as PeriodFilterDto['period'],
    startDate: selectedPeriod === 'CUSTOM' && startDate ? startDate : undefined,
    endDate: selectedPeriod === 'CUSTOM' && endDate ? endDate : undefined,
  };

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['superAdminDashboardStats', queryParams, selectedSubsidiaryId],
    queryFn: () => getDashboardStats(queryParams, selectedSubsidiaryId || undefined),
    enabled: isCustomPeriodValid,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
        <h1 className="text-4xl font-bold text-slate-800">{t('superAdmin.title')}</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col">
            <label htmlFor="subsidiary-selector" className="text-xs font-medium text-slate-500 mb-1">
              {t('superAdmin.subsidiarySelectorLabel')}
            </label>
            <select
              id="subsidiary-selector"
              value={selectedSubsidiaryId}
              onChange={(e) => setSelectedSubsidiaryId(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">{t('superAdmin.allSubsidiaries')}</option>
              {subsidiaries?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subsidiaryName}
                </option>
              ))}
            </select>
          </div>
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

      {selectedPeriod === 'CUSTOM' && (!startDate || !endDate || startDate > endDate) ? (
        <div className="p-6 text-center text-slate-500">{t('analytics.periods.selectDates')}</div>
      ) : isLoading ? (
        <div>{t('common.loading')}</div>
      ) : dashboardData ? (
        <DashboardView data={dashboardData} />
      ) : null}
    </div>
  );
};

export default SuperAdminDashboard;
