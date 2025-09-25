

import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import { MOCK_SUBSIDIARIES } from '../../constants';
import PeriodFilter from '../filters/PeriodFilter';
import DashboardView from './DashboardView';
import SalesAnalysisView from './SalesAnalysisView';
import PurchaseAnalysisView from './PurchaseAnalysisView';
import BankView from './BankView';
import SafeView from './SafeView';
import { useAppContext } from '../../context/AppContext';

type AnalyticsView = 'general' | 'dashboard' | 'sales' | 'purchases' | 'banks' | 'safe';

const Analytics: React.FC = () => {
    const { state } = useAppContext();
    const { currentSubsidiary, products, sales, orders, contacts, currentUser, purchaseOrders } = state;
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<AnalyticsView>('dashboard');
    const [selectedSubsidiaryId, setSelectedSubsidiaryId] = useState(currentSubsidiary?.id || '');
    const [selectedPeriod, setSelectedPeriod] = useState('thirty_days');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPeriod = e.target.value;
        setSelectedPeriod(newPeriod);
        if (newPeriod !== 'custom') {
            setStartDate('');
            setEndDate('');
        }
    };

    const renderActiveView = () => {
        const subsidiary = MOCK_SUBSIDIARIES.find(s => s.id === selectedSubsidiaryId) || currentSubsidiary;
        if (!subsidiary || !currentUser) return null;

        const commonProps = {
            subsidiary,
            period: selectedPeriod,
            startDate,
            endDate,
        };

        switch (activeTab) {
            case 'dashboard':
                return <DashboardView {...commonProps} products={products} sales={sales} orders={orders} clients={contacts} currentUser={currentUser} />;
            case 'sales':
                return <SalesAnalysisView {...commonProps} orders={orders} sales={sales} products={products} clients={contacts} currentUser={currentUser} />;
            case 'purchases':
                return <PurchaseAnalysisView {...commonProps} purchaseOrders={purchaseOrders} products={products} />;
            case 'banks':
                return <BankView {...commonProps} />;
            case 'safe':
                return <SafeView {...commonProps} />;
            default:
                return <DashboardView {...commonProps} products={products} sales={sales} orders={orders} clients={contacts} currentUser={currentUser} />;
        }
    };

    const TABS: { view: AnalyticsView; label: string }[] = [
        { view: 'dashboard', label: t('analytics.tabs.dashboard') },
        { view: 'sales', label: t('analytics.tabs.salesAnalysis') },
        { view: 'purchases', label: t('analytics.tabs.purchaseAnalysis') },
        { view: 'banks', label: t('analytics.tabs.banks') },
        { view: 'safe', label: t('analytics.tabs.safe') },
    ];

    const TabButton: React.FC<{ view: AnalyticsView; label: string }> = ({ view, label }) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none ${
                activeTab === view
                    ? 'border-slate-800 text-slate-800'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <h1 className="text-4xl font-bold text-slate-800">{t('analytics.title')}</h1>
                <div className="flex items-center space-x-4">
                    <div>
                         <label htmlFor="subsidiary-filter" className="text-sm font-medium text-slate-600 sr-only">Filiale</label>
                         <select
                            id="subsidiary-filter"
                            value={selectedSubsidiaryId}
                            onChange={(e) => setSelectedSubsidiaryId(e.target.value)}
                            className="bg-white border border-slate-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 sm:text-sm"
                         >
                            <option value="">Toutes les filiales</option>
                            {MOCK_SUBSIDIARIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                    </div>
                    <PeriodFilter 
                        period={selectedPeriod}
                        onPeriodChange={handlePeriodChange}
                        startDate={startDate}
                        onStartDateChange={e => setStartDate(e.target.value)}
                        endDate={endDate}
                        onEndDateChange={e => setEndDate(e.target.value)}
                    />
                </div>
            </div>

            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                        <TabButton key={tab.view} view={tab.view} label={tab.label} />
                    ))}
                </nav>
            </div>
            
            <div className="mt-6">
                {renderActiveView()}
            </div>
        </div>
    );
};

export default Analytics;