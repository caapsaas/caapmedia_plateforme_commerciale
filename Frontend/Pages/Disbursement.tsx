import React, { useState } from 'react';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { AccountType } from '../types';
import PeriodFilter from '../components/filters/PeriodFilter';
import TreasuryAccountTypeView from '../components/analytics/TreasuryAccountTypeView';
import { PeriodFilter as PeriodFilterType } from '../services/apiStatistic/apiAnalytics';

type DisbursementTab = 'banks' | 'safe' | 'cash' | 'expenseBox';

// Page autonome "Décaissement" — séparée de l'onglet Analyse (voir demande
// explicite : "décaissement est à part"), même découpage que gmo
// (components/DisbursementPage.tsx) : un onglet par type de compte, chacun
// affichant la liste des comptes + le bouton de décaissement + l'historique
// des mouvements (TreasuryAccountTypeView, déjà construit pour cet usage).
const Disbursement: React.FC = () => {
    const { t } = useI18n();
    const { subsidiary } = useAuth();
    const [activeTab, setActiveTab] = useState<DisbursementTab>('banks');
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilterType>('last_30_days');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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

    const TABS: { view: DisbursementTab; label: string; accountType: AccountType }[] = [
        { view: 'banks', label: t('analytics.tabs.banks'), accountType: AccountType.BANQUE },
        { view: 'safe', label: t('analytics.tabs.safe'), accountType: AccountType.SAFE },
        { view: 'cash', label: t('analytics.tabs.cash'), accountType: AccountType.CAISSE },
        { view: 'expenseBox', label: t('analytics.tabs.expenseBox'), accountType: AccountType.EXPENSE_BOX },
    ];

    const activeAccountType = TABS.find(tab => tab.view === activeTab)?.accountType ?? AccountType.BANQUE;
    const activeLabel = TABS.find(tab => tab.view === activeTab)?.label ?? '';

    if (!subsidiary) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <h1 className="text-4xl font-bold text-slate-800">{t('sidebar.disbursement')}</h1>
                <PeriodFilter
                    period={selectedPeriod}
                    onPeriodChange={handlePeriodChange}
                    startDate={startDate}
                    onStartDateChange={handleStartDateChange}
                    endDate={endDate}
                    onEndDateChange={handleEndDateChange}
                />
            </div>

            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.view}
                            onClick={() => setActiveTab(tab.view)}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${
                                activeTab === tab.view
                                    ? 'border-slate-800 text-slate-800'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-6">
                <TreasuryAccountTypeView
                    subsidiary={subsidiary}
                    accountType={activeAccountType}
                    title={activeLabel}
                    period={selectedPeriod}
                    startDate={startDate || undefined}
                    endDate={endDate || undefined}
                />
            </div>
        </div>
    );
};

export default Disbursement;
