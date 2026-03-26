import React from 'react';
import { Kpi } from '../types';
import { useI18n } from '../i18n';

const KpiCard: React.FC<Kpi> = ({ titleKey, value, change, changeType, icon }) => {
  const { t } = useI18n();
  const changeColor = changeType === 'increase' ? 'text-green-500' : 'text-red-500';
  const changeBgColor = changeType === 'increase' ? 'bg-green-100' : 'bg-red-100';

  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-slate-500">{t(titleKey)}</h4>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 mt-2 break-words overflow-wrap-anywhere">{value}</p>
        <div className={`text-sm font-semibold mt-1 inline-flex items-center px-2 py-1 rounded-full ${changeBgColor} ${changeColor}`}>
          {change}
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
