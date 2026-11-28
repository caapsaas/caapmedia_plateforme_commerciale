import React from 'react';
import { useI18n } from '../../i18n';

interface PeriodFilterProps {
    period: string;
    onPeriodChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    startDate: string;
    onStartDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    endDate: string;
    onEndDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PeriodFilter: React.FC<PeriodFilterProps> = ({ period, onPeriodChange, startDate, onStartDateChange, endDate, onEndDateChange }) => {
    const { t } = useI18n();

    return (
        <div className="flex flex-wrap items-center justify-start md:justify-end gap-4">
            <div className="flex items-center space-x-2">
                <label htmlFor="period-filter" className="text-sm font-medium text-slate-600 shrink-0">{t('analytics.periodFilter')}:</label>
                <select
                    id="period-filter"
                    value={period}
                    onChange={onPeriodChange}
                    className="h-9 bg-white border border-[var(--border-strong)] rounded-[var(--radius-sm)] shadow-2xs pl-3 pr-9 text-left text-sm text-slate-700 cursor-pointer hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6e911]/40 focus:border-slate-400"
                >
                    <option value="all_time">{t('filter.allTime')}</option>
                    <option value="this_month">{t('pnl.thisMonth')}</option>
                    <option value="last_month">{t('pnl.lastMonth')}</option>
                    <option value="last_7_days">{t('analytics.periods.seven_days')}</option>
                    <option value="last_30_days">{t('analytics.periods.thirty_days')}</option>
                    <option value="last_90_days">{t('analytics.periods.ninety_days')}</option>
                    <option value="this_year">{t('analytics.periods.year')}</option>
                    <option value="custom">{t('analytics.periods.custom')}</option>
                </select>
            </div>
            
            {period === 'custom' && (
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="date"
                        id="start-date-filter"
                        value={startDate}
                        max={endDate || undefined}
                        onChange={onStartDateChange}
                        className="h-9 bg-white border border-[var(--border-strong)] rounded-[var(--radius-sm)] shadow-2xs px-3 text-left text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c6e911]/40 focus:border-slate-400"
                        aria-label={t('analytics.startDate')}
                    />
                    <span className="text-slate-400">-</span>
                    <input
                        type="date"
                        id="end-date-filter"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={onEndDateChange}
                        className="h-9 bg-white border border-[var(--border-strong)] rounded-[var(--radius-sm)] shadow-2xs px-3 text-left text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c6e911]/40 focus:border-slate-400"
                        aria-label={t('analytics.endDate')}
                    />
                </div>
            )}
        </div>
    );
};

export default PeriodFilter;
