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
                    className="bg-white border border-slate-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-[#c6e911] focus:border-[#c6e911] sm:text-sm"
                >
                    <option value="all_time">{t('filter.allTime')}</option>
                    <option value="this_month">{t('pnl.thisMonth')}</option>
                    <option value="last_month">{t('pnl.lastMonth')}</option>
                    <option value="seven_days">{t('analytics.periods.seven_days')}</option>
                    <option value="thirty_days">{t('analytics.periods.thirty_days')}</option>
                    <option value="ninety_days">{t('analytics.periods.ninety_days')}</option>
                    <option value="year">{t('analytics.periods.year')}</option>
                    <option value="custom">{t('analytics.periods.custom')}</option>
                </select>
            </div>
            
            {period === 'custom' && (
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="date"
                        id="start-date-filter"
                        value={startDate}
                        onChange={onStartDateChange}
                        className="bg-white border border-slate-300 rounded-md shadow-sm px-3 py-2 text-left focus:outline-none focus:ring-1 focus:ring-[#c6e911] focus:border-[#c6e911] sm:text-sm"
                        aria-label={t('analytics.startDate')}
                    />
                    <span className="text-slate-500">-</span>
                    <input
                        type="date"
                        id="end-date-filter"
                        value={endDate}
                        onChange={onEndDateChange}
                        className="bg-white border border-slate-300 rounded-md shadow-sm px-3 py-2 text-left focus:outline-none focus:ring-1 focus:ring-[#c6e911] focus:border-[#c6e911] sm:text-sm"
                        aria-label={t('analytics.endDate')}
                    />
                </div>
            )}
        </div>
    );
};

export default PeriodFilter;