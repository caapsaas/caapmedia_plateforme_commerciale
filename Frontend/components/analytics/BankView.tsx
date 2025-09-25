import React from 'react';
import { Subsidiary } from '../../types';
import { useI18n } from '../../i18n';

interface BankViewProps {
  subsidiary: Subsidiary;
  period: string;
  startDate?: string;
  endDate?: string;
}

const BankView: React.FC<BankViewProps> = ({ subsidiary, period, startDate, endDate }) => {
  const { t } = useI18n();

  return (
    <div className="bg-white p-6 rounded-xl shadow-md text-center">
      <h3 className="text-xl font-semibold text-slate-800">{t('analytics.tabs.banks')}</h3>
      <p className="mt-4 text-slate-500">{t('analytics.comingSoon')}</p>
      <div className="mt-2 text-xs text-slate-400">
        <p>Filiale : {subsidiary.name}</p>
        {period === 'custom' && startDate && endDate ? (
          <p>
            {t('analytics.startDate')}: {startDate} - {t('analytics.endDate')}: {endDate}
          </p>
        ) : (
          <p>Période sélectionnée: {t(`analytics.periods.${period}`)}</p>
        )}
      </div>
    </div>
  );
};

export default BankView;
