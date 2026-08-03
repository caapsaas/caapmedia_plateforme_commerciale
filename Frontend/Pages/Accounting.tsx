import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCanModifyAccounting } from '../hooks/useCanModifyAccounting';
import { getFiscalYears, FiscalYear } from '../services/apiAccounting/apiPeriods';
import { getMyAccessStatus } from '../services/apiAccounting/apiAccountingAccess';
import AccountingDashboard from '../components/accounting/AccountingDashboard';
import ChartOfAccounts from '../components/accounting/ChartOfAccounts';
import JournalEntries from '../components/accounting/JournalEntries';
import Immobilisations from '../components/accounting/Immobilisations';
import GrandLivre from '../components/accounting/GrandLivre';
import BalanceGenerale from '../components/accounting/BalanceGenerale';
import JournalCentralisateur from '../components/accounting/JournalCentralisateur';
import SyscohadaStatements from '../components/accounting/SyscohadaStatements';
import AccountingSettings from '../components/accounting/AccountingSettings';
import AccountingAccessRequestView from '../components/accounting/AccountingAccessRequestView';
import CrmListSkeleton from '../components/ui/CrmListSkeleton';

type AccountingTab =
  | 'dashboard'
  | 'ecritures'
  | 'journal-centralisateur'
  | 'grand-livre'
  | 'balance'
  | 'plan-comptable'
  | 'immobilisations'
  | 'parametres'
  | 'etats-financiers';

const TAB_LABELS: Record<AccountingTab, string> = {
  dashboard: 'Tableau de bord',
  ecritures: 'Écritures',
  'journal-centralisateur': 'Journal centralisateur',
  'grand-livre': 'Grand livre',
  balance: 'Balance générale',
  'plan-comptable': 'Plan comptable',
  immobilisations: 'Immobilisations',
  parametres: 'Paramètres',
  'etats-financiers': 'États financiers',
};

/** Badge d'accès JIT actif — recalculé toutes les 30s, cf. Accounting.tsx (gmo) `AccessCountdown`. */
const AccessCountdown: React.FC<{ expiresAt: string }> = ({ expiresAt }) => {
  const [now, setNow] = useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const msLeft = new Date(expiresAt).getTime() - now;
  if (msLeft <= 0) return null;
  const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
  const remaining = hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}min` : `${minutesLeft}min`;

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
      <Clock className="w-3.5 h-3.5" />
      Accès actif — expire dans {remaining}
    </div>
  );
};

const Accounting: React.FC = () => {
  const { subsidiary } = useAuth();
  const [activeTab, setActiveTab] = useState<AccountingTab>('dashboard');

  const canSeeStatements = useCanModifyAccounting();

  // Gate JIT — poll 60s, cf. Doc/module-comptabilite-plan-implementation.md §3.2.
  const { data: accessStatus, isLoading: isLoadingAccess } = useQuery({
    queryKey: ['accounting-access-my-status'],
    queryFn: getMyAccessStatus,
    enabled: !!subsidiary,
    refetchInterval: 60000,
  });

  const { data: fiscalPeriods = [] } = useQuery<FiscalYear[]>({
    queryKey: ['accounting-periods'],
    queryFn: getFiscalYears,
    enabled: !!subsidiary && !!accessStatus?.hasAccess,
  });

  const currentPeriod = useMemo(
    () => fiscalPeriods.find((p) => !p.isClosed) ?? fiscalPeriods[0],
    [fiscalPeriods],
  );

  const availableTabs = useMemo(() => {
    const tabs: AccountingTab[] = [
      'dashboard',
      'ecritures',
      'journal-centralisateur',
      'grand-livre',
      'balance',
      'plan-comptable',
      'immobilisations',
      'parametres',
    ];
    if (canSeeStatements) tabs.push('etats-financiers');
    return tabs;
  }, [canSeeStatements]);

  if (!subsidiary || isLoadingAccess) {
    return <CrmListSkeleton columns={5} />;
  }

  if (!accessStatus?.hasAccess) {
    return <AccountingAccessRequestView status={accessStatus!} />;
  }

  const renderContent = () => {
    if (!availableTabs.includes(activeTab)) {
      return <div className="py-16 text-center text-slate-400">Vous n'avez pas accès à cette section.</div>;
    }
    switch (activeTab) {
      case 'dashboard':
        return <AccountingDashboard fiscalPeriods={fiscalPeriods} />;
      case 'plan-comptable':
        return <ChartOfAccounts />;
      case 'ecritures':
        return <JournalEntries fiscalPeriods={fiscalPeriods} />;
      case 'immobilisations':
        return <Immobilisations />;
      case 'grand-livre':
        return <GrandLivre fiscalPeriods={fiscalPeriods} />;
      case 'balance':
        return <BalanceGenerale fiscalPeriods={fiscalPeriods} />;
      case 'journal-centralisateur':
        return <JournalCentralisateur fiscalPeriods={fiscalPeriods} />;
      case 'etats-financiers':
        return <SyscohadaStatements fiscalPeriods={fiscalPeriods} />;
      case 'parametres':
        return <AccountingSettings fiscalPeriods={fiscalPeriods} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 no-print">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-3xl font-bold text-slate-800">Comptabilité</h2>
          {accessStatus.reason === 'APPROVED' && <AccessCountdown expiresAt={accessStatus.expiresAt} />}
          {currentPeriod && (
            <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${currentPeriod.isClosed ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {currentPeriod.isClosed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {currentPeriod.name} {currentPeriod.isClosed ? '(clôturé)' : '(ouvert)'}
            </div>
          )}
        </div>
        <p className="text-sm text-slate-500">SYSCOHADA révisé 2017 — {subsidiary.name || subsidiary.subsidiaryName || 'Filiale'}</p>
      </div>

      {/* Navigation tabs — une seule rangée plate, comme sur gmo */}
      <div className="flex items-center space-x-2 p-1 bg-slate-200 rounded-lg self-start sm:self-center overflow-x-auto max-w-full no-print">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c6e911] whitespace-nowrap ${
              activeTab === tab ? 'bg-[#c6e911] text-slate-800 shadow' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Contenu — tous les onglets rendent dans une carte unique, comme sur gmo */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[600px]">
        {renderContent()}
      </div>
    </div>
  );
};

export default Accounting;
