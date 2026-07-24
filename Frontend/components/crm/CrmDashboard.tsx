import React, { useMemo } from 'react';
import { Subsidiary, Contact, Interaction, CrmTask, CrmTaskStatus, Opportunity, OpportunityStage } from '../../types';
import { useI18n } from '../../i18n';
import KpiCard from '../../Pages/KpiCard';
import IconCurrency from '../icons/IconCurrency';
import IconFunnel from '../icons/IconFunnel';
import IconBullhorn from '../icons/IconBullhorn';
import IconClipboardCheck from '../icons/IconClipboardCheck';
import IconChatBubbleLeftRight from '../icons/IconChatBubbleLeftRight';
import IconTrendingUp from '../icons/IconTrendingUp';

interface CrmDashboardProps {
    subsidiary: Subsidiary;
    contacts: Contact[];
    interactions: Interaction[];
    crmTasks: CrmTask[];
    opportunities: Opportunity[];
    onUpdateTaskStatus: (taskId: string, status: CrmTaskStatus) => void;
}

const FUNNEL_STAGES: { key: OpportunityStage; color: string }[] = [
    { key: OpportunityStage.QUALIFICATION, color: '#6366f1' },
    { key: OpportunityStage.PROPOSAL,      color: '#f59e0b' },
    { key: OpportunityStage.NEGOTIATION,   color: '#f97316' },
    { key: OpportunityStage.WON,           color: '#22c55e' },
    { key: OpportunityStage.LOST,          color: '#ef4444' },
];

const CrmDashboard: React.FC<CrmDashboardProps> = ({
    contacts,
    interactions,
    crmTasks,
    opportunities,
    onUpdateTaskStatus,
}) => {
    const { t, formatCurrency } = useI18n();

    const kpis = useMemo(() => {
        const active = opportunities.filter(
            o => o.stage !== OpportunityStage.WON && o.stage !== OpportunityStage.LOST,
        );
        const won = opportunities.filter(o => o.stage === OpportunityStage.WON);
        const closed = opportunities.filter(
            o => o.stage === OpportunityStage.WON || o.stage === OpportunityStage.LOST,
        );
        const pipelineValue = active.reduce((sum, o) => sum + o.opportunityValue, 0);
        const conversionRate = closed.length > 0 ? (won.length / closed.length) * 100 : 0;
        const newOpportunities = active.length;
        return { pipelineValue, conversionRate, newOpportunities };
    }, [opportunities]);

    const funnelData = useMemo(() => {
        const maxCount = Math.max(
            ...FUNNEL_STAGES.map(s => opportunities.filter(o => o.stage === s.key).length),
            1,
        );
        return FUNNEL_STAGES.map(s => ({
            ...s,
            count: opportunities.filter(o => o.stage === s.key).length,
            width: (opportunities.filter(o => o.stage === s.key).length / maxCount) * 100,
        }));
    }, [opportunities]);

    const pendingTasks = useMemo(
        () => crmTasks.filter(task => task.status !== CrmTaskStatus.DONE).slice(0, 8),
        [crmTasks],
    );

    const recentInteractions = useMemo(() => interactions.slice(0, 8), [interactions]);

    const contactMap = useMemo(
        () => new Map(contacts.map(c => [c.id, c.contactName])),
        [contacts],
    );

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <KpiCard
                    titleKey="crm.dashboard.pipelineValue"
                    value={formatCurrency(kpis.pipelineValue)}
                    change=""
                    changeType="increase"
                    icon={<IconCurrency className="h-8 w-8 text-blue-500" />}
                />
                <KpiCard
                    titleKey="crm.dashboard.conversionRate"
                    value={`${kpis.conversionRate.toFixed(1)}%`}
                    change=""
                    changeType="increase"
                    icon={<IconTrendingUp className="h-8 w-8 text-green-500" />}
                />
                <KpiCard
                    titleKey="crm.dashboard.newOpportunities"
                    value={kpis.newOpportunities.toString()}
                    change=""
                    changeType="increase"
                    icon={<IconBullhorn className="h-8 w-8 text-indigo-500" />}
                />
            </div>

            {/* Funnel + Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Sales Funnel */}
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-semibold text-lg mb-5 text-slate-700 flex items-center gap-2">
                        <IconFunnel className="h-6 w-6 text-slate-500" />
                        {t('crm.dashboard.salesFunnel')}
                    </h3>
                    {opportunities.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">
                            {t('common.noData')}
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {funnelData.map(stage => (
                                <div key={stage.key}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-slate-600">
                                            {t(`crm.opportunity.stages.${stage.key}`)}
                                        </span>
                                        <span className="text-sm font-bold text-slate-700">
                                            {stage.count}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3">
                                        <div
                                            className="h-3 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${stage.width}%`,
                                                backgroundColor: stage.color,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pending Tasks */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-semibold text-lg mb-4 text-slate-700 flex items-center gap-2">
                        <IconClipboardCheck className="h-6 w-6 text-slate-500" />
                        {t('crm.dashboard.myTasks')}
                    </h3>
                    {pendingTasks.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">
                            {t('common.noData')}
                        </p>
                    ) : (
                        <ul className="space-y-3 overflow-y-auto max-h-72">
                            {pendingTasks.map(task => (
                                <li
                                    key={task.id}
                                    className="flex items-start justify-between p-2 bg-slate-50 rounded-md gap-2"
                                >
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm truncate">{task.title}</p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {contactMap.get(task.contactId) ?? '—'} · {task.dueDate}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onUpdateTaskStatus(task.id, CrmTaskStatus.DONE)}
                                        className="shrink-0 text-xs font-semibold text-green-600 hover:underline"
                                    >
                                        {t('crm.tasks.complete')}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="font-semibold text-lg mb-4 text-slate-700 flex items-center gap-2">
                    <IconChatBubbleLeftRight className="h-6 w-6 text-slate-500" />
                    {t('crm.dashboard.recentActivity')}
                </h3>
                {recentInteractions.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">{t('common.noData')}</p>
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {recentInteractions.map(interaction => (
                            <li
                                key={interaction.id}
                                className="text-sm border-l-4 border-slate-200 pl-3 py-1"
                            >
                                <p className="font-semibold text-slate-700">
                                    {t(`crm.interactions.types.${interaction.type ?? 'OTHER'}`)}
                                    {contactMap.get(interaction.contactId)
                                        ? ` · ${contactMap.get(interaction.contactId)}`
                                        : ''}
                                </p>
                                {interaction.notes && (
                                    <p className="text-slate-600 truncate text-xs">{interaction.notes}</p>
                                )}
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {new Date(interaction.date).toLocaleString()}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CrmDashboard;
