import React, { useState } from 'react';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { AccountType, UserRole } from '../types';
import PeriodFilter from '../components/filters/PeriodFilter';
import TreasuryAccountTypeView from '../components/analytics/TreasuryAccountTypeView';
import SafeDisbursementModal from '../components/finance/SafeDisbursementModal';
import BankDisbursementModal from '../components/finance/BankDisbursementModal';
import { PeriodFilter as PeriodFilterType } from '../services/apiStatistic/apiAnalytics';

type DisbursementTab = 'banks' | 'safe';

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none whitespace-nowrap ${
            isActive ? 'bg-[#c6e911] text-slate-900 shadow' : 'bg-white text-slate-600 hover:bg-slate-100'
        }`}
    >
        {label}
    </button>
);

// Page autonome "Décaissement" — réservée au SUPER_ADMIN (Coffre-fort et
// Banques sont centralisés au siège, voir TreasuryService.createAccount) :
// « le super admin gère le coffre et les banques », comme sur gmo
// (Frontend_GMO/components/DisbursementPage.tsx, restreint à
// ADMIN+filiale siège — SUPER_ADMIN est l'équivalent omniscient côté
// caapmedia), même en-tête/pastilles d'onglets. La Caisse dépense a été
// déplacée dans Finance & Gestion (gérée par le Directeur Financier de
// chaque filiale) et la Caisse ne fait l'objet d'aucun décaissement direct
// (uniquement des remises de caisse).
const Disbursement: React.FC = () => {
    const { t } = useI18n();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<DisbursementTab>('banks');
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilterType>('last_30_days');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const activeRole = user?.activeRole ?? user?.userRole;
    const canAccess = activeRole === UserRole.SUPER_ADMIN;

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

    const TABS: { view: DisbursementTab; label: string; accountType: AccountType; subtitle: string }[] = [
        { view: 'banks', label: t('analytics.tabs.banks'), accountType: AccountType.BANQUE, subtitle: t('bankDisbursement.subtitle') },
        { view: 'safe', label: t('analytics.tabs.safe'), accountType: AccountType.SAFE, subtitle: t('safeDisbursement.subtitle') },
    ];

    const activeConfig = TABS.find(tab => tab.view === activeTab) ?? TABS[0];

    if (!canAccess) {
        return (
            <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
                {t('disbursement.accessDenied')}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">{t('sidebar.disbursement')}</h2>
                <div className="flex items-center space-x-2 p-1 bg-slate-200 rounded-lg self-start sm:self-center">
                    {TABS.map(tab => (
                        <TabButton key={tab.view} label={tab.label} isActive={activeTab === tab.view} onClick={() => setActiveTab(tab.view)} />
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <PeriodFilter
                    period={selectedPeriod}
                    onPeriodChange={handlePeriodChange}
                    startDate={startDate}
                    onStartDateChange={handleStartDateChange}
                    endDate={endDate}
                    onEndDateChange={handleEndDateChange}
                />
            </div>

            <TreasuryAccountTypeView
                accountType={activeConfig.accountType}
                title={activeConfig.label}
                subtitle={activeConfig.subtitle}
                period={selectedPeriod}
                startDate={startDate || undefined}
                endDate={endDate || undefined}
                renderDisbursementModal={({ isOpen, onClose }) =>
                    activeTab === 'safe' ? (
                        <SafeDisbursementModal isOpen={isOpen} onClose={onClose} />
                    ) : (
                        <BankDisbursementModal isOpen={isOpen} onClose={onClose} />
                    )
                }
            />
        </div>
    );
};

export default Disbursement;
