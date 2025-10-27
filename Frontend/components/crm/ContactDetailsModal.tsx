import React, { useState } from 'react';
import { Contact, Opportunity, Interaction, CrmTask, InteractionType, Contract } from '../../types';
import { useI18n } from '../../i18n';
import InteractionForm from './InteractionForm';

interface ContactDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Contact;
    opportunities: Opportunity[];
    interactions: Interaction[];
    tasks: CrmTask[];
    contracts: Contract[];
    onLogInteraction: (data: Omit<Interaction, 'id' | 'date' | 'userId'>) => void;
}

type DetailsView = 'info' | 'interactions' | 'opportunities' | 'tasks' | 'contracts';

const ContactDetailsModal: React.FC<ContactDetailsModalProps> = ({
    isOpen,
    onClose,
    client,
    opportunities,
    interactions,
    tasks,
    contracts,
    onLogInteraction,
}) => {
    const { t, formatCurrency } = useI18n();
    const [activeTab, setActiveTab] = useState<DetailsView>('interactions');

    if (!isOpen) return null;

    const handleSaveInteraction = (data: { type: InteractionType; notes: string; }) => {
        onLogInteraction({ ...data, contactId: client.id });
    };

    const TabButton: React.FC<{ view: DetailsView; label: string; count?: number }> = ({ view, label, count }) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F7941F] ${
                activeTab === view
                    ? 'bg-[#F7941F] text-white shadow'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
        >
            <span>{label}</span>
            {typeof count !== 'undefined' && <span className="text-xs bg-slate-300 rounded-full px-2">{count}</span>}
        </button>
    );

    const renderContent = () => {
        switch(activeTab) {
            case 'interactions':
                return (
                    <div className="space-y-4">
                        <InteractionForm onSave={handleSaveInteraction} />
                        <h4 className="font-semibold text-slate-700 pt-4 border-t">{t('crm.dashboard.recentActivity')}</h4>
                        <div className="space-y-3">
                        {interactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(interaction => (
                            <div key={interaction.id} className="text-sm border-l-4 border-slate-200 pl-4">
                                <p className="font-semibold">{t(`crm.interactions.types.${interaction.type}`)} - <span className="text-xs text-slate-500">{new Date(interaction.date).toLocaleString()}</span></p>
                                <p className="text-slate-600">{interaction.notes}</p>
                            </div>
                        ))}
                        {interactions.length === 0 && <p className="text-sm text-slate-500">{t('crm.contacts.details.noInteractions')}</p>}
                        </div>
                    </div>
                );
            case 'opportunities':
                return (
                     <ul className="space-y-2">
                        {opportunities.map(opp => (
                            <li key={opp.id} className="p-2 border rounded-md">
                                <p className="font-semibold">{opp.opportunityName}</p>
                                <p className="text-sm">{t(`crm.opportunity.stages.${opp.stage}`)} - {formatCurrency(opp.opportunityValue)}</p>
                            </li>
                        ))}
                    </ul>
                );
            case 'contracts':
                return (
                     <ul className="space-y-2">
                        {contracts.map(contract => (
                            <li key={contract.id} className="p-2 border rounded-md">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold">{contract.title}</p>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800`}>
                                       {t(`crm.contracts.status_${contract.status}`)}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600">{formatCurrency(contract.amount)}</p>
                                <p className="text-xs text-slate-500">{`Du ${contract.startDate} au ${contract.endDate}`}</p>
                            </li>
                        ))}
                    </ul>
                );
             // Render other tabs here
            default:
                return <p className="text-slate-500">{t('analytics.comingSoon')}</p>
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-slate-900">{client.contactName}</h3>
                    <p className="text-slate-600">{client.company}</p>
                </div>
                <div className="p-4 bg-slate-50 border-b">
                    <div className="flex items-center flex-wrap gap-2">
                        <TabButton view="info" label={t('crm.contacts.details.info')} />
                        <TabButton view="interactions" label={t('crm.contacts.details.interactions')} count={interactions.length} />
                        <TabButton view="opportunities" label={t('crm.contacts.details.opportunities')} count={opportunities.length} />
                        <TabButton view="contracts" label={t('crm.contacts.details.contracts')} count={contracts.length} />
                        <TabButton view="tasks" label={t('crm.contacts.details.tasks')} count={tasks.length} />
                    </div>
                </div>
                <div className="p-6 overflow-y-auto flex-grow">
                    {renderContent()}
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactDetailsModal;
