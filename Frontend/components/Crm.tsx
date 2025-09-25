import React, { useState, useMemo } from 'react';
import { Subsidiary, Contact, Opportunity, Interaction, CrmTask, User, OpportunityStage, Lead, Account, Contract, CrmTaskStatus } from '../types';
import { useI18n } from '../i18n';
import CrmDashboard from './crm/CrmDashboard';
import OpportunityPipeline from './crm/OpportunityPipeline';
import ContactManagement from './crm/ContactManagement';
import ActivitiesView from './crm/ActivitiesView';
import LeadsManagement from './crm/LeadsManagement';
import AccountManagement from './crm/AccountManagement';
import ContractManagement from './crm/ContractManagement';

type CrmView = 'dashboard' | 'leads' | 'accounts' | 'contacts' | 'pipeline' | 'activities' | 'contracts';

interface CrmProps {
    subsidiary: Subsidiary;
    currentUser: User;
    users: User[];
    contacts: Contact[];
    opportunities: Opportunity[];
    interactions: Interaction[];
    crmTasks: CrmTask[];
    leads: Lead[];
    accounts: Account[];
    contracts: Contract[];
    onSaveOpportunity: (data: Partial<Opportunity>) => void;
    onUpdateOpportunityStage: (oppId: string, newStage: OpportunityStage) => void;
    onWinOpportunity: (opportunity: Opportunity) => void;
    onLogInteraction: (data: Omit<Interaction, 'id' | 'date' | 'userId'>) => void;
    onConvertLead: (leadId: string) => void;
    onSaveTask: (data: Omit<CrmTask, 'id' | 'userId'> & { id?: string }) => void;
    onUpdateTaskStatus: (taskId: string, status: CrmTaskStatus) => void;
    onSaveContact: (data: Omit<Contact, 'id' | 'subsidiaryId'> & { id?: string }) => void;
    onDeleteContact: (id: string) => void;
    onSaveLead: (data: Omit<Lead, 'id' | 'subsidiaryId'> & { id?: string }) => void;
    onDeleteLead: (id: string) => void;
    onSaveAccount: (data: Omit<Account, 'id' | 'subsidiaryId'> & { id?: string }) => void;
    onDeleteAccount: (id: string) => void;
    onSaveContract: (data: Omit<Contract, 'id' | 'subsidiaryId'> & { id?: string }) => void;
    onDeleteContract: (id: string) => void;
}

const Crm: React.FC<CrmProps> = (props) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<CrmView>('leads');
    
    const { currentUser, subsidiary } = props;

    const userFilteredData = useMemo(() => {
        const isFullAccess = currentUser.role === 'ADMIN' || currentUser.role === 'FINANCIAL_DIRECTOR';

        const filterBySubsidiary = <T extends { subsidiaryId: string }>(items: T[]) => items.filter(i => i.subsidiaryId === subsidiary.id);
        const filterByUser = <T extends { salesRepId?: string }>(items: T[]) => items.filter(i => i.salesRepId === currentUser.id);
        const filterTaskByUser = <T extends { userId?: string }>(items: T[]) => items.filter(i => i.userId === currentUser.id);

        const contacts = isFullAccess ? filterBySubsidiary(props.contacts) : filterByUser(filterBySubsidiary(props.contacts));
        const leads = isFullAccess ? filterBySubsidiary(props.leads) : props.leads.filter(l => l.subsidiaryId === subsidiary.id && (l.salesRepId === currentUser.id || !l.salesRepId));
        const accounts = isFullAccess ? filterBySubsidiary(props.accounts) : filterByUser(filterBySubsidiary(props.accounts));
        const opportunities = isFullAccess ? filterBySubsidiary(props.opportunities) : props.opportunities.filter(o => o.userId === currentUser.id && o.subsidiaryId === subsidiary.id);
        const contracts = filterBySubsidiary(props.contracts);

        const contactIds = new Set(contacts.map(c => c.id));
        const interactions = props.interactions.filter(i => contactIds.has(i.contactId));
        const crmTasks = isFullAccess ? props.crmTasks : filterTaskByUser(props.crmTasks);

        return { contacts, leads, accounts, opportunities, interactions, crmTasks, contracts };
    }, [props, currentUser, subsidiary.id]);

    const renderActiveView = () => {
        const baseProps = { subsidiary, currentUser };

        switch (activeTab) {
            case 'dashboard':
                return <CrmDashboard {...baseProps} {...userFilteredData} />;
            case 'leads':
                return <LeadsManagement 
                           {...baseProps}
                           leads={userFilteredData.leads}
                           onSave={props.onSaveLead}
                           onDelete={props.onDeleteLead}
                           onConvertLead={props.onConvertLead}
                        />;
            case 'accounts':
                return <AccountManagement 
                            {...baseProps}
                            accounts={userFilteredData.accounts}
                            onSave={props.onSaveAccount}
                            onDelete={props.onDeleteAccount}
                        />;
            case 'contacts':
                return <ContactManagement 
                            {...baseProps}
                            clients={userFilteredData.contacts}
                            onSave={props.onSaveContact}
                            onDelete={props.onDeleteContact}
                            opportunities={userFilteredData.opportunities}
                            interactions={userFilteredData.interactions}
                            crmTasks={userFilteredData.crmTasks}
                            contracts={userFilteredData.contracts}
                            onLogInteraction={props.onLogInteraction}
                        />;
            case 'contracts':
                return <ContractManagement 
                            {...baseProps}
                            contracts={userFilteredData.contracts}
                            contacts={props.contacts}
                            onSave={props.onSaveContract}
                            onDelete={props.onDeleteContract}
                        />;
            case 'pipeline':
                return <OpportunityPipeline 
                            {...baseProps} 
                            opportunities={userFilteredData.opportunities}
                            clients={userFilteredData.contacts}
                            allClients={props.contacts}
                            onSaveOpportunity={props.onSaveOpportunity}
                            onUpdateOpportunityStage={props.onUpdateOpportunityStage}
                            onWinOpportunity={props.onWinOpportunity}
                        />;
            case 'activities':
                return <ActivitiesView 
                            contacts={userFilteredData.contacts}
                            interactions={userFilteredData.interactions}
                            crmTasks={userFilteredData.crmTasks}
                            onSaveTask={props.onSaveTask}
                            onUpdateTaskStatus={props.onUpdateTaskStatus}
                        />;
            default:
                return <CrmDashboard {...baseProps} {...userFilteredData} />;
        }
    };

    const TabButton: React.FC<{ view: CrmView; label: string }> = ({ view, label }) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c6e911] ${
                activeTab === view
                    ? 'bg-[#c6e911] text-slate-800 shadow'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">{t('crm.title')}</h2>
                <div className="flex items-center flex-wrap gap-2 p-1 bg-slate-200 rounded-lg self-start sm:self-center">
                    <TabButton view="dashboard" label={t('crm.tabs.dashboard')} />
                    <TabButton view="leads" label={t('crm.tabs.leads')} />
                    <TabButton view="accounts" label={t('crm.tabs.accounts')} />
                    <TabButton view="contacts" label={t('crm.tabs.contacts')} />
                    <TabButton view="contracts" label={t('crm.tabs.contracts')} />
                    <TabButton view="pipeline" label={t('crm.tabs.pipeline')} />
                    <TabButton view="activities" label={t('crm.tabs.tasks')} />
                </div>
            </div>
            
            <div>
                {renderActiveView()}
            </div>
        </div>
    );
};

export default Crm;