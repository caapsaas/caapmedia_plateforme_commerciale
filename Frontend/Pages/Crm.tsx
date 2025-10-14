import React, { useState, useMemo } from 'react';
import { Subsidiary, Contact, Opportunity, Interaction, CrmTask, User, OpportunityStage, Lead, Account, Contract, CrmTaskStatus } from '../types';
import { useI18n } from '../i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getContacts, saveContact, deleteContact,
    getOpportunities, saveOpportunity, updateOpportunityStage, winOpportunity,
    getLeads, saveLead, deleteLead, convertLead,
    getAccounts, saveAccount, deleteAccount,
    getContracts, saveContract, deleteContract,
    getCrmTasks, saveTask, updateTaskStatus, 
    getInteractions, logInteraction 
} from '../services/apiCrm/apiCrm';
import { getAllUsers } from '../services/apiCommon/apiUserAuth';
import CrmDashboard from '../components/crm/CrmDashboard';
import OpportunityPipeline from '../components/crm/OpportunityPipeline';
import ContactManagement from '../components/crm/ContactManagement';
import ActivitiesView from '../components/crm/ActivitiesView';
import LeadsManagement from '../components/crm/LeadsManagement';
import AccountManagement from '../components/crm/AccountManagement';
import ContractManagement from '../components/crm/ContractManagement';

type CrmView = 'dashboard' | 'leads' | 'accounts' | 'contacts' | 'pipeline' | 'activities' | 'contracts';

interface CrmProps {
    subsidiary: Subsidiary;
    currentUser: User;
}

const Crm: React.FC<CrmProps> = (props) => {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<CrmView>('leads');
    
    const { currentUser, subsidiary } = props;

    // --- Data Fetching avec React Query ---
    const queryKey = (key: string) => [key, subsidiary.id];

    const { data: contacts = [], isLoading: l1 } = useQuery<Contact[]>({ queryKey: queryKey('contacts'), queryFn: () => getContacts(subsidiary.id) });
    const { data: opportunities = [], isLoading: l2 } = useQuery<Opportunity[]>({ queryKey: queryKey('opportunities'), queryFn: () => getOpportunities(subsidiary.id) });
    const { data: leads = [], isLoading: l3 } = useQuery<Lead[]>({ queryKey: queryKey('leads'), queryFn: () => getLeads(subsidiary.id) });
    const { data: accounts = [], isLoading: l4 } = useQuery<Account[]>({ queryKey: queryKey('accounts'), queryFn: () => getAccounts(subsidiary.id) });
    const { data: contracts = [], isLoading: l5 } = useQuery<Contract[]>({ queryKey: queryKey('contracts'), queryFn: () => getContracts(subsidiary.id) });
    const { data: crmTasks = [], isLoading: l6 } = useQuery<CrmTask[]>({ queryKey: queryKey('crmTasks'), queryFn: () => getCrmTasks(subsidiary.id) });
    const { data: interactions = [], isLoading: l7 } = useQuery<Interaction[]>({ queryKey: queryKey('interactions'), queryFn: () => getInteractions(subsidiary.id) });
    const { data: users = [], isLoading: l8 } = useQuery<User[]>({ queryKey: ['users', subsidiary.id], queryFn: () => getAllUsers() });

    const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8;

    // --- Mutations avec React Query ---
    const invalidateCrmQueries = () => {
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
        queryClient.invalidateQueries({ queryKey: ['opportunities'] });
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        queryClient.invalidateQueries({ queryKey: ['contracts'] });
        queryClient.invalidateQueries({ queryKey: ['crmTasks'] });
        queryClient.invalidateQueries({ queryKey: ['interactions'] });
    };

    const { mutate: onSaveContact } = useMutation({ mutationFn: saveContact, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('contacts') }) });
    const { mutate: onDeleteContact } = useMutation({ mutationFn: deleteContact, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('contacts') }) });
    const { mutate: onSaveLead } = useMutation({ mutationFn: saveLead, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('leads') }) });
    const { mutate: onDeleteLead } = useMutation({ mutationFn: deleteLead, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('leads') }) });
    const { mutate: onConvertLead } = useMutation({ mutationFn: convertLead, onSuccess: invalidateCrmQueries });
    const { mutate: onSaveAccount } = useMutation({ mutationFn: saveAccount, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('accounts') }) });
    const { mutate: onDeleteAccount } = useMutation({ mutationFn: deleteAccount, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('accounts') }) });
    const { mutate: onSaveContract } = useMutation({ mutationFn: saveContract, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('contracts') }) });
    const { mutate: onDeleteContract } = useMutation({ mutationFn: deleteContract, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('contracts') }) });
    const { mutate: onSaveOpportunity } = useMutation({ mutationFn: saveOpportunity, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('opportunities') }) });
    const { mutate: onUpdateOpportunityStage } = useMutation({ mutationFn: updateOpportunityStage, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('opportunities') }) });
    const { mutate: onWinOpportunity } = useMutation({ mutationFn: winOpportunity, onSuccess: invalidateCrmQueries });
    const { mutate: onSaveTask } = useMutation({ mutationFn: saveTask, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('crmTasks') }) });
    const { mutate: onUpdateTaskStatus } = useMutation({ mutationFn: updateTaskStatus, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('crmTasks') }) });
    const { mutate: onLogInteraction } = useMutation({ mutationFn: logInteraction, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('interactions') }) });

    const userFilteredData = useMemo(() => {
        const isFullAccess = currentUser.role === 'ADMIN' || currentUser.role === 'FINANCIAL_DIRECTOR';

        const filterBySubsidiary = <T extends { subsidiaryId: string }>(items: T[]) => items.filter(i => i.subsidiaryId === subsidiary.id);
        const filterByUser = <T extends { salesRepId?: string }>(items: T[]) => items.filter(i => i.salesRepId === currentUser.id);
        const filterTaskByUser = <T extends { userId?: string }>(items: T[]) => items.filter(i => i.userId === currentUser.id);

        const filteredContacts = isFullAccess ? filterBySubsidiary(contacts) : filterByUser(filterBySubsidiary(contacts));
        const filteredLeads = isFullAccess ? filterBySubsidiary(leads) : leads.filter(l => l.subsidiaryId === subsidiary.id && (l.salesRepId === currentUser.id || !l.salesRepId));
        const filteredAccounts = isFullAccess ? filterBySubsidiary(accounts) : filterByUser(filterBySubsidiary(accounts));
        const filteredOpportunities = isFullAccess ? filterBySubsidiary(opportunities) : opportunities.filter(o => o.userId === currentUser.id && o.subsidiaryId === subsidiary.id);
        const filteredContracts = filterBySubsidiary(contracts);

        const contactIds = new Set(filteredContacts.map(c => c.id));
        const filteredInteractions = interactions.filter(i => contactIds.has(i.contactId));
        const filteredCrmTasks = isFullAccess ? crmTasks : filterTaskByUser(crmTasks);

        return { contacts: filteredContacts, leads: filteredLeads, accounts: filteredAccounts, opportunities: filteredOpportunities, interactions: filteredInteractions, crmTasks: filteredCrmTasks, contracts: filteredContracts };
    }, [contacts, opportunities, leads, accounts, contracts, crmTasks, interactions, currentUser, subsidiary.id]);

    const renderActiveView = () => {
        const baseProps = { subsidiary, currentUser };

        if (isLoading) {
            return <div className="p-6 text-center">{t('common.loading')}</div>;
        }

        switch (activeTab) {
            case 'dashboard':
                return <CrmDashboard {...baseProps} {...userFilteredData} onUpdateTaskStatus={(taskId, status) => onUpdateTaskStatus({ taskId, status })} />;
            case 'leads':
                return <LeadsManagement 
                           {...baseProps}
                           leads={userFilteredData.leads}
                           onSave={(data) => onSaveLead(data)}
                           onDelete={(id) => onDeleteLead(id)}
                           onConvertLead={(id) => onConvertLead(id)}
                        />;
            case 'accounts':
                return <AccountManagement 
                            {...baseProps}
                            accounts={userFilteredData.accounts}
                            onSave={(data) => onSaveAccount(data)}
                            onDelete={(id) => onDeleteAccount(id)}
                        />;
            case 'contacts':
                return <ContactManagement 
                            {...baseProps}
                            clients={userFilteredData.contacts}
                            onSave={(data) => onSaveContact(data)}
                            onDelete={(id) => onDeleteContact(id)}
                            opportunities={userFilteredData.opportunities}
                            interactions={userFilteredData.interactions}
                            crmTasks={userFilteredData.crmTasks}
                            contracts={userFilteredData.contracts} // Pas de changement ici, c'était déjà bon
                            onLogInteraction={(data) => onLogInteraction(data)}
                        />;
            case 'contracts':
                return <ContractManagement 
                            {...baseProps}
                            contracts={userFilteredData.contracts}
                            contacts={contacts}
                            onSave={(data) => onSaveContract(data)}
                            onDelete={(id) => onDeleteContract(id)}
                        />;
            case 'pipeline':
                return <OpportunityPipeline 
                            {...baseProps} 
                            opportunities={userFilteredData.opportunities}
                            clients={userFilteredData.contacts} // Clients the user can see
                            allClients={contacts} // All clients for selection
                            onSaveOpportunity={(data) => onSaveOpportunity(data)}
                            onUpdateOpportunityStage={(oppId, newStage) => onUpdateOpportunityStage({ oppId, newStage })}
                            onWinOpportunity={(data) => onWinOpportunity(data)}
                        />;
            case 'activities':
                return <ActivitiesView 
                            contacts={userFilteredData.contacts}
                            interactions={userFilteredData.interactions}
                            crmTasks={userFilteredData.crmTasks}
                            onSaveTask={(data) => onSaveTask(data)}
                            onUpdateTaskStatus={(taskId, status) => onUpdateTaskStatus({ taskId, status })}
                        />;
            default:
                return <CrmDashboard {...baseProps} {...userFilteredData} onUpdateTaskStatus={(taskId, status) => onUpdateTaskStatus({ taskId, status })} />;
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