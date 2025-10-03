import React, { useState, useMemo } from 'react';
import { Contact, Opportunity, Interaction, CrmTask, OpportunityStage, Lead, Account, Contract, CrmTaskStatus, User } from './types';
import { useAppContext } from './context/AppContext';
import { useI18n } from './i18n';
import CrmDashboard from './components/crm/CrmDashboard';
import OpportunityPipeline from './components/crm/OpportunityPipeline';
import ContactManagement from './components/crm/ContactManagement';
import ActivitiesView from './components/crm/ActivitiesView';
import LeadsManagement from './components/crm/LeadsManagement';
import AccountManagement from './components/crm/AccountManagement';
import ContractManagement from './components/crm/ContractManagement';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccounts, getContacts, getContracts, getCrmTasks, getInteractions, getLeads, getOpportunities, updateCrmTaskStatus, updateOpportunityStage } from './services/apiCrm';
import { api } from './services/api';

type CrmView = 'dashboard' | 'leads' | 'accounts' | 'contacts' | 'pipeline' | 'activities' | 'contracts';

const Crm: React.FC = () => {
    const { t } = useI18n();
    const { state } = useAppContext();
    const [activeTab, setActiveTab] = useState<CrmView>('leads');
    const queryClient = useQueryClient();
    
    const { currentUser, currentSubsidiary: subsidiary } = state;

    if (!currentUser || !subsidiary) {
        // Idéalement, la route devrait être protégée et ne jamais arriver ici.
        return <div>Chargement ou erreur d'authentification...</div>;
    }

    // --- TanStack Query Hooks ---
    const { data: contactsData, isLoading: isLoadingContacts } = useQuery({ queryKey: ['contacts'], queryFn: getContacts });
    const { data: leadsData, isLoading: isLoadingLeads } = useQuery({ queryKey: ['leads'], queryFn: getLeads });
    const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
    const { data: opportunitiesData, isLoading: isLoadingOpps } = useQuery({ queryKey: ['opportunities'], queryFn: getOpportunities });
    const { data: contractsData, isLoading: isLoadingContractsData } = useQuery({ queryKey: ['contracts'], queryFn: getContracts });
    const { data: interactionsData, isLoading: isLoadingInteractions } = useQuery({ queryKey: ['interactions'], queryFn: getInteractions });
    const { data: crmTasksData, isLoading: isLoadingTasks } = useQuery({ queryKey: ['crmTasks'], queryFn: getCrmTasks });
    const { data: usersData, isLoading: isLoadingUsers } = useQuery<User[]>({ queryKey: ['users'], queryFn: () => api.get('/users').then(res => res.data) });

    // --- TanStack Mutation Hooks ---
    const createOrUpdateMutation = (entity: string) => useMutation({
        mutationFn: (data: any) => data.id ? api.patch(`/${entity}/${data.id}`, data) : api.post(`/${entity}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [entity] }),
    });

    const deleteMutation = (entity: string) => useMutation({
        mutationFn: (id: string) => api.delete(`/${entity}/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [entity] }),
    });

    const onSaveOpportunity = createOrUpdateMutation('opportunities').mutate;
    const onSaveContact = createOrUpdateMutation('contacts').mutate;
    const onDeleteContact = deleteMutation('contacts').mutate;
    const onSaveLead = createOrUpdateMutation('leads').mutate;
    const onDeleteLead = deleteMutation('leads').mutate;
    const onSaveAccount = createOrUpdateMutation('accounts').mutate;
    const onDeleteAccount = deleteMutation('accounts').mutate;
    const onSaveContract = createOrUpdateMutation('contracts').mutate;
    const onDeleteContract = deleteMutation('contracts').mutate;
    const onLogInteraction = createOrUpdateMutation('interactions').mutate;
    const onSaveTask = createOrUpdateMutation('crm-tasks').mutate;

    const { mutate: updateOppStageMutate } = useMutation({
        mutationFn: updateOpportunityStage,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
    });
    const onUpdateOpportunityStage = (oppId: string, newStage: OpportunityStage) => updateOppStageMutate({ oppId, newStage });

    const { mutate: updateTaskStatusMutate } = useMutation({
        mutationFn: updateCrmTaskStatus,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crmTasks'] }),
    });
    const onUpdateTaskStatus = (taskId: string, status: CrmTaskStatus) => updateTaskStatusMutate({ taskId, status });

    const onConvertLead = useMutation({ mutationFn: (leadId: string) => api.post(`/leads/${leadId}/convert`), onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
    }}).mutate;
    const onWinOpportunity = useMutation({ mutationFn: (opportunity: Opportunity) => api.post(`/opportunities/${opportunity.id}/win`), onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['opportunities'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
    }}).mutate;

    const userFilteredData = useMemo(() => {
        const isFullAccess = currentUser.role === 'ADMIN' || currentUser.role === 'FINANCIAL_DIRECTOR';

        const filterBySubsidiary = <T extends { subsidiaryId: string }>(items: T[]) => items.filter(i => i.subsidiaryId === subsidiary.id);
        const filterByUser = <T extends { salesRepId?: string }>(items: T[]) => items.filter(i => i.salesRepId === currentUser.id);
        const filterTaskByUser = <T extends { userId?: string }>(items: T[]) => items.filter(i => i.userId === currentUser.id);

        const allContacts = contactsData || [];
        const allLeads = leadsData || [];
        const allAccounts = accountsData || [];
        const allOpportunities = opportunitiesData || [];
        const allContracts = contractsData || [];
        const allInteractions = interactionsData || [];
        const allCrmTasks = crmTasksData || [];

        const contacts = isFullAccess ? filterBySubsidiary(allContacts) : filterByUser(filterBySubsidiary(allContacts));
        const leads = isFullAccess ? filterBySubsidiary(allLeads) : allLeads.filter(l => l.subsidiaryId === subsidiary.id && (l.salesRepId === currentUser.id || !l.salesRepId));
        const accounts = isFullAccess ? filterBySubsidiary(allAccounts) : filterByUser(filterBySubsidiary(allAccounts));
        const opportunities = isFullAccess ? filterBySubsidiary(allOpportunities) : allOpportunities.filter(o => o.userId === currentUser.id && o.subsidiaryId === subsidiary.id);
        const contracts = filterBySubsidiary(allContracts);

        const contactIds = new Set(contacts.map(c => c.id));
        const interactions = allInteractions.filter(i => contactIds.has(i.contactId));
        const crmTasks = isFullAccess ? allCrmTasks : filterTaskByUser(allCrmTasks);

        return { contacts, leads, accounts, opportunities, interactions, crmTasks, contracts };
    }, [contactsData, leadsData, accountsData, opportunitiesData, contractsData, interactionsData, crmTasksData, currentUser, subsidiary.id]);

    if (isLoadingContacts || isLoadingLeads || isLoadingAccounts || isLoadingOpps || isLoadingContractsData || isLoadingInteractions || isLoadingTasks || isLoadingUsers) {
        return <div>Chargement des données du CRM...</div>;
    }

    const renderActiveView = () => {
        const baseProps = { subsidiary, currentUser, users: usersData || [] };

        switch (activeTab) {
            case 'dashboard':
                return <CrmDashboard {...baseProps} {...userFilteredData} />;
            case 'leads':
                return <LeadsManagement 
                           {...baseProps}
                           leads={userFilteredData.leads}
                           onSave={onSaveLead}
                           onDelete={onDeleteLead}
                           onConvertLead={onConvertLead}
                        />;
            case 'accounts':
                return <AccountManagement 
                            {...baseProps}
                            accounts={userFilteredData.accounts}
                            onSave={onSaveAccount}
                            onDelete={onDeleteAccount}
                        />;
            case 'contacts':
                return <ContactManagement 
                            {...baseProps}
                            clients={userFilteredData.contacts}
                            onSave={onSaveContact}
                            onDelete={onDeleteContact}
                            opportunities={userFilteredData.opportunities}
                            interactions={userFilteredData.interactions}
                            crmTasks={userFilteredData.crmTasks}
                            contracts={userFilteredData.contracts}
                            onLogInteraction={onLogInteraction}
                        />;
            case 'contracts':
                return <ContractManagement 
                            {...baseProps}
                            contracts={userFilteredData.contracts}
                            contacts={contactsData || []}
                            onSave={onSaveContract}
                            onDelete={onDeleteContract}
                        />;
            case 'pipeline':
                return <OpportunityPipeline 
                            {...baseProps} 
                            opportunities={userFilteredData.opportunities}
                            clients={userFilteredData.contacts}
                            allClients={contactsData || []}
                            onSaveOpportunity={onSaveOpportunity}
                            onUpdateOpportunityStage={onUpdateOpportunityStage}
                            onWinOpportunity={onWinOpportunity}
                        />;
            case 'activities':
                return <ActivitiesView 
                            contacts={userFilteredData.contacts}
                            interactions={userFilteredData.interactions}
                            crmTasks={userFilteredData.crmTasks}
                            onSaveTask={onSaveTask}
                            onUpdateTaskStatus={onUpdateTaskStatus}
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