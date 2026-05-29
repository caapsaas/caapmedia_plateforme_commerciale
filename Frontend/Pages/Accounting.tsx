import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getFiscalPeriods, FiscalPeriod } from '../services/apiAccounting/apiAccounting';
import ChartOfAccounts from '../components/accounting/ChartOfAccounts';
import JournalEntries from '../components/accounting/JournalEntries';
import FiscalPeriods from '../components/accounting/FiscalPeriods';
import GrandLivre from '../components/accounting/GrandLivre';
import BalanceGenerale from '../components/accounting/BalanceGenerale';
import JournalCentralisateur from '../components/accounting/JournalCentralisateur';
import SyscohadaStatements from '../components/accounting/SyscohadaStatements';

type AccountingTab =
  | 'plan-comptable'
  | 'ecritures'
  | 'exercices'
  | 'grand-livre'
  | 'balance'
  | 'journal-centralisateur'
  | 'etats-financiers';

const TAB_LABELS: { id: AccountingTab; label: string }[] = [
  { id: 'plan-comptable', label: 'Plan comptable' },
  { id: 'ecritures', label: 'Écritures' },
  { id: 'exercices', label: 'Exercices' },
  { id: 'grand-livre', label: 'Grand livre' },
  { id: 'balance', label: 'Balance générale' },
  { id: 'journal-centralisateur', label: 'Journal centralisateur' },
  { id: 'etats-financiers', label: 'États financiers' },
];

const REPORT_TABS: AccountingTab[] = ['grand-livre', 'balance', 'journal-centralisateur', 'etats-financiers'];

const Accounting: React.FC = () => {
  const { subsidiary } = useAuth();
  const [activeTab, setActiveTab] = useState<AccountingTab>('plan-comptable');

  const { data: fiscalPeriods = [] } = useQuery<FiscalPeriod[]>({
    queryKey: ['accounting-periods'],
    queryFn: getFiscalPeriods,
    enabled: !!subsidiary,
  });

  if (!subsidiary) {
    return <div className="p-6 text-center text-slate-500">Chargement...</div>;
  }

  const TabButton: React.FC<{ tab: AccountingTab }> = ({ tab }) => {
    const def = TAB_LABELS.find((t) => t.id === tab)!;
    const isReport = REPORT_TABS.includes(tab);
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c6e911] whitespace-nowrap ${
          activeTab === tab
            ? 'bg-[#c6e911] text-slate-800 shadow'
            : isReport
            ? 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            : 'bg-white text-slate-600 hover:bg-slate-100'
        }`}
      >
        {def.label}
      </button>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'plan-comptable':
        return <ChartOfAccounts />;
      case 'ecritures':
        return <JournalEntries fiscalPeriods={fiscalPeriods} />;
      case 'exercices':
        return <FiscalPeriods />;
      case 'grand-livre':
        return <GrandLivre fiscalPeriods={fiscalPeriods} />;
      case 'balance':
        return <BalanceGenerale fiscalPeriods={fiscalPeriods} />;
      case 'journal-centralisateur':
        return <JournalCentralisateur fiscalPeriods={fiscalPeriods} />;
      case 'etats-financiers':
        return <SyscohadaStatements fiscalPeriods={fiscalPeriods} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 no-print">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Comptabilité</h2>
          <p className="text-sm text-slate-500 mt-1">
            SYSCOHADA révisé 2017 — {subsidiary.name || 'Filiale'}
          </p>
        </div>

        {fiscalPeriods.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {fiscalPeriods.filter((p) => p.status === 'OPEN').length > 0
              ? `Exercice ouvert : ${fiscalPeriods.find((p) => p.status === 'OPEN')?.label}`
              : 'Aucun exercice ouvert'}
          </div>
        )}
      </div>

      {/* Navigation tabs */}
      <div className="no-print">
        {/* Main operations */}
        <div className="flex items-center flex-wrap gap-2 p-1 bg-slate-200 rounded-lg self-start mb-2">
          <TabButton tab="plan-comptable" />
          <TabButton tab="ecritures" />
          <TabButton tab="exercices" />
        </div>
        {/* Reports group */}
        <div className="flex items-center flex-wrap gap-2 p-1 bg-slate-100 rounded-lg self-start border border-slate-200">
          <span className="text-xs font-semibold text-slate-400 uppercase px-2">Rapports</span>
          <TabButton tab="grand-livre" />
          <TabButton tab="balance" />
          <TabButton tab="journal-centralisateur" />
          <TabButton tab="etats-financiers" />
        </div>
      </div>

      {/* Content */}
      <div>
        {renderContent()}
      </div>
    </div>
  );
};

export default Accounting;
