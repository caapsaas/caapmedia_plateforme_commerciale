import React from 'react';
import { Kpi } from '../types';
import { useI18n } from '../i18n';

const KpiCard: React.FC<Kpi> = ({ titleKey, value, change, changeType, icon }) => {
  const { t } = useI18n();
  const changeColor = changeType === 'increase' ? 'text-green-500' : 'text-red-500';
  const changeBgColor = changeType === 'increase' ? 'bg-green-100' : 'bg-red-100';

  return (
    <div className="bg-white p-5 rounded-[var(--radius-lg)] border border-[var(--border)] shadow-2xs hover:border-[var(--border-strong)] hover:shadow-sm transition-all duration-200 flex flex-col justify-between gap-3">
      <div className="flex justify-between items-start gap-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t(titleKey)}</h4>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-slate-900 break-words overflow-wrap-anywhere">{value}</p>
        {change && change.trim().length > 0 && (
          <div className={`text-xs font-semibold mt-2 inline-flex items-center px-2 py-0.5 rounded-full tabular-nums ${changeBgColor} ${changeColor}`}>
            {change}
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
