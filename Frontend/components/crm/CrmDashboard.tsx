import React from 'react';
import { Subsidiary, Contact, Opportunity, Interaction, CrmTask, User, OpportunityStage, Kpi, CrmTaskStatus } from '../../types';
import { useI18n } from '../../i18n';
import KpiCard from '../../Pages/KpiCard';
import IconCurrency from '../icons/IconCurrency';
import IconTrendingUp from '../icons/IconTrendingUp';
import IconBullhorn from '../icons/IconBullhorn';
import IconFunnel from '../icons/IconFunnel';
import IconClipboardCheck from '../icons/IconClipboardCheck';
import IconChatBubbleLeftRight from '../icons/IconChatBubbleLeftRight';
import IconShoppingCart from '../icons/IconShoppingCart';

interface CrmDashboardProps {
    subsidiary: Subsidiary;
    currentUser: User;
    contacts: Contact[];
    opportunities: Opportunity[];
    interactions: Interaction[];
    crmTasks: CrmTask[];
}

const CrmDashboard: React.FC<CrmDashboardProps> = ({ opportunities, crmTasks, interactions, contacts }) => {
    const { t, formatCurrency } = useI18n();

    const pipelineValue = opportunities
        .filter(o => o.stage !== OpportunityStage.WON && o.stage !== OpportunityStage.LOST)
        .reduce((sum, o) => sum + o.value, 0);
    
    const wonOpportunities = opportunities.filter(o => o.stage === OpportunityStage.WON);
    const totalClosedOpportunities = opportunities.filter(o => o.stage === OpportunityStage.WON || o.stage === OpportunityStage.LOST);
    const conversionRate = totalClosedOpportunities.length > 0 ? (wonOpportunities.length / totalClosedOpportunities.length) * 100 : 0;

    const newOpportunitiesThisMonth = opportunities.filter(o => new Date(o.closeDate).getMonth() === new Date().getMonth()).length;
    const newWebOpportunities = opportunities.filter(o => o.source === 'web_order' || o.source === 'quote_request').length;

    const kpis: Kpi[] = [
        { titleKey: 'crm.dashboard.pipelineValue', value: formatCurrency(pipelineValue), change: '+5%', changeType: 'increase', icon: <IconCurrency className="h-8 w-8 text-blue-500" /> },
        { titleKey: 'crm.dashboard.conversionRate', value: `${conversionRate.toFixed(1)}%`, change: '+1.2%', changeType: 'increase', icon: <IconFunnel className="h-8 w-8 text-green-500" /> },
        { titleKey: 'crm.dashboard.newOpportunities', value: newOpportunitiesThisMonth.toString(), change: `+${newOpportunitiesThisMonth}`, changeType: 'increase', icon: <IconBullhorn className="h-8 w-8 text-indigo-500" /> },
        { titleKey: 'crm.dashboard.newWebOpportunities', value: newWebOpportunities.toString(), change: `+${newWebOpportunities}`, changeType: 'increase', icon: <IconShoppingCart className="h-8 w-8 text-purple-500" /> },
    ];

    const myTasks = crmTasks.filter(t => t.status !== CrmTaskStatus.DONE);
    const recentInteractions = interactions.slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map(kpi => <KpiCard key={kpi.titleKey} {...kpi} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-semibold text-lg mb-4 text-slate-700 flex items-center gap-2">
                        <IconClipboardCheck className="h-6 w-6 text-slate-500" />
                        {t('crm.dashboard.myTasks')}
                    </h3>
                    <ul className="space-y-3">
                        {myTasks.map(task => (
                            <li key={task.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                                <div>
                                    <p className="font-semibold">{task.title}</p>
                                    <p className="text-xs text-slate-500">{contacts.find(c=> c.id === task.contactId)?.name || ''} - {task.dueDate}</p>
                                </div>
                                <button className="text-xs font-semibold text-green-600 hover:underline">Terminer</button>
                            </li>
                        ))}
                        {myTasks.length === 0 && <p className="text-sm text-slate-500">Aucune tâche en cours.</p>}
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-semibold text-lg mb-4 text-slate-700 flex items-center gap-2">
                        <IconChatBubbleLeftRight className="h-6 w-6 text-slate-500" />
                        {t('crm.dashboard.recentActivity')}
                    </h3>
                     <ul className="space-y-3">
                        {recentInteractions.map(interaction => (
                            <li key={interaction.id} className="text-sm border-l-4 border-slate-200 pl-4">
                                <p className="font-semibold">{t(`crm.interactions.types.${interaction.type}`)} avec {contacts.find(c=> c.id === interaction.contactId)?.name || ''}</p>
                                <p className="text-slate-600 truncate">{interaction.notes}</p>
                                <p className="text-xs text-slate-400">{new Date(interaction.date).toLocaleString()}</p>
                            </li>
                        ))}
                         {recentInteractions.length === 0 && <p className="text-sm text-slate-500">Aucune activité récente.</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default CrmDashboard;