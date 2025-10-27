import React, { useState, useMemo } from 'react';
import { Contact, Interaction, CrmTask, User, InteractionType, CrmTaskStatus, CrmTaskPriority } from '../../types';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import IconPhone from '../icons/IconPhone';
import IconMail from '../icons/IconMail';
import IconUsers from '../icons/IconUsers';
import IconClipboardList from '../icons/IconClipboardList';
import IconChevronDown from '../icons/IconChevronDown';
import IconChatBubbleLeftRight from '../icons/IconChatBubbleLeftRight';

interface ActivitiesViewProps {
    contacts: Contact[];
    interactions: Interaction[];
    crmTasks: CrmTask[];
    onSaveTask: (data: Omit<CrmTask, 'id' | 'userId'>) => void;
    onUpdateTaskStatus: (taskId: string, status: CrmTaskStatus) => void;
}

const InteractionIcon: React.FC<{ type: InteractionType }> = ({ type }) => {
    switch(type) {
        case InteractionType.CALL: return <IconPhone className="h-5 w-5 text-blue-500" />;
        case InteractionType.EMAIL: return <IconMail className="h-5 w-5 text-green-500" />;
        case InteractionType.MEETING: return <IconUsers className="h-5 w-5 text-purple-500" />;
        default: return <IconChatBubbleLeftRight className="h-5 w-5 text-slate-500" />;
    }
}

const ActivitiesView: React.FC<ActivitiesViewProps> = ({ contacts, interactions, crmTasks, onSaveTask, onUpdateTaskStatus }) => {
    const { t } = useI18n();

    const TASK_TITLE_KEYS = [
        "follow_up_call",
        "send_quote",
        "schedule_meeting",
        "follow_up_proposal",
        "send_documentation",
        "check_in_email"
    ];
    
    const [newTask, setNewTask] = useState({ title: t(`crm.taskTitles.${TASK_TITLE_KEYS[0]}`), contactId: '', dueDate: '', status: CrmTaskStatus.TODO, description: '', priority: CrmTaskPriority.MEDIUM });
    const [priorityFilter, setPriorityFilter] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: 'dueDate' | 'priority', direction: 'ascending' | 'descending' }>({ key: 'dueDate', direction: 'descending' });

    const sortedTasks = useMemo(() => {
        let sortableItems = [...crmTasks];
        if (priorityFilter) {
            sortableItems = sortableItems.filter(t => t.priority === priorityFilter);
        }
        sortableItems.sort((a, b) => {
            if (sortConfig.key === 'priority') {
                const priorityOrder = { [CrmTaskPriority.HIGH]: 3, [CrmTaskPriority.MEDIUM]: 2, [CrmTaskPriority.LOW]: 1 };
                if (priorityOrder[a.priority] < priorityOrder[b.priority]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (priorityOrder[a.priority] > priorityOrder[b.priority]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
            } else { // dueDate
                if (new Date(a.dueDate) < new Date(b.dueDate)) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (new Date(a.dueDate) > new Date(b.dueDate)) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
            }
            return 0;
        });
        return sortableItems;
    }, [crmTasks, priorityFilter, sortConfig]);
    
    const recentInteractions = useMemo(() => {
        return interactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    }, [interactions]);


    const getContactName = (contactId: string) => contacts.find(c => c.id === contactId)?.contactName || 'N/A';
    
    const handleNewTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewTask(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleNewTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title || !newTask.contactId || !newTask.dueDate) return;
        onSaveTask({ title: newTask.title, contactId: newTask.contactId, dueDate: newTask.dueDate, status: newTask.status, description: newTask.description, priority: newTask.priority });
        setNewTask({ title: t(`crm.taskTitles.${TASK_TITLE_KEYS[0]}`), contactId: '', dueDate: '', status: CrmTaskStatus.TODO, description: '', priority: CrmTaskPriority.MEDIUM });
    };

    const requestSort = (key: 'dueDate' | 'priority') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const getPriorityClass = (priority: CrmTaskPriority) => {
        switch (priority) {
            case CrmTaskPriority.HIGH: return 'bg-red-100 text-red-800';
            case CrmTaskPriority.MEDIUM: return 'bg-yellow-100 text-yellow-800';
            case CrmTaskPriority.LOW: return 'bg-blue-100 text-blue-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };
    
    const SortableHeader: React.FC<{ label: string; sortKey: 'dueDate' | 'priority'}> = ({label, sortKey}) => (
         <button onClick={() => requestSort(sortKey)} className="flex items-center gap-1">
            {label}
            {sortConfig.key === sortKey && <IconChevronDown className={`h-4 w-4 transition-transform ${sortConfig.direction === 'ascending' ? 'rotate-180' : ''}`} />}
        </button>
    )

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <form onSubmit={handleNewTaskSubmit} className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-800">{t('crm.activities.addTask')}</h3>
                    {/* Remplacer Flexbox par Grid pour un meilleur contrôle du responsive */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
                        <select name="title" value={newTask.title} onChange={handleNewTaskChange} className="lg:col-span-2 border-slate-300 rounded-md shadow-sm w-full" required>
                            {TASK_TITLE_KEYS.map(key => (
                                <option key={key} value={t(`crm.taskTitles.${key}`)}>{t(`crm.taskTitles.${key}`)}</option>
                            ))}
                        </select>
                        <select name="contactId" value={newTask.contactId} onChange={handleNewTaskChange} className="border-slate-300 rounded-md shadow-sm w-full" required>
                            <option value="">{t('crm.activities.selectContact')}</option>
                            {contacts.map(c => <option key={c.id} value={c.id}>{c.contactName}</option>)}
                        </select>
                        <select name="priority" id="priority" value={newTask.priority} onChange={handleNewTaskChange} className="border-slate-300 rounded-md shadow-sm w-full">
                            {Object.values(CrmTaskPriority).map(p => (
                                <option key={p} value={p}>{t(`crm.tasks.priority_${p}`)}</option>
                            ))}
                        </select>
                        <input type="date" name="dueDate" value={newTask.dueDate} onChange={handleNewTaskChange} className="border-slate-300 rounded-md shadow-sm w-full" required/>
                        <button type="submit" className="px-4 py-2 bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#adc40f] flex items-center justify-center gap-2 w-full">
                           <IconPlus className="h-5 w-5" />
                           {t('common.add')}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{t('crm.tabs.tasks')}</h3>
                    <div>
                        <label htmlFor="priority-filter" className="sr-only">{t('crm.tasks.filterByPriority')}</label>
                        <select id="priority-filter" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="border-slate-300 rounded-md shadow-sm text-sm">
                             <option value="">{t('crm.tasks.allPriorities')}</option>
                             {Object.values(CrmTaskPriority).map(p => (
                                <option key={p} value={p}>{t(`crm.tasks.priority_${p}`)}</option>
                            ))}
                        </select>
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 w-12"></th>
                                <th className="px-6 py-3">{t('crm.tasks.title')}</th>
                                <th className="px-6 py-3">{t('crm.tasks.relatedTo')}</th>
                                <th className="px-6 py-3"><SortableHeader label={t('crm.tasks.dueDate')} sortKey="dueDate" /></th>
                                <th className="px-6 py-3"><SortableHeader label={t('crm.tasks.priority')} sortKey="priority" /></th>
                            </tr>
                        </thead>
                        <tbody>
                             {sortedTasks.map(task => (
                                <tr key={task.id} className="border-b hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <input type="checkbox" checked={task.status === CrmTaskStatus.DONE} onChange={() => onUpdateTaskStatus(task.id, task.status === CrmTaskStatus.DONE ? CrmTaskStatus.TODO : CrmTaskStatus.DONE)} className="h-5 w-5 rounded text-[#c6e911] focus:ring-[#adc40f]"/>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className={`font-semibold ${task.status === CrmTaskStatus.DONE ? 'line-through text-slate-500' : ''}`}>{task.title}</p>
                                    </td>
                                    <td className="px-6 py-4">{getContactName(task.contactId)}</td>
                                    <td className="px-6 py-4">{task.dueDate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityClass(task.priority)}`}>
                                            {t(`crm.tasks.priority_${task.priority}`)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sortedTasks.length === 0 && <p className="text-center py-8 text-slate-500">{t('crm.activities.noActivity')}</p>}
                </div>
            </div>

             <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="font-semibold text-lg mb-4 text-slate-700 flex items-center gap-2">
                    <IconChatBubbleLeftRight className="h-6 w-6 text-slate-500" />
                    {t('crm.dashboard.recentActivity')}
                </h3>
                 <ul className="space-y-3">
                    {recentInteractions.map(interaction => (
                        <li key={interaction.id} className="text-sm border-l-4 border-slate-200 pl-4">
                            <p className="font-semibold">{t(`crm.interactions.types.${interaction.type}`)} avec {getContactName(interaction.contactId)}</p>
                            <p className="text-slate-600 truncate">{interaction.notes}</p>
                            <p className="text-xs text-slate-400">{new Date(interaction.date).toLocaleString()}</p>
                        </li>
                    ))}
                     {recentInteractions.length === 0 && <p className="text-sm text-slate-500">{t('crm.contacts.details.noInteractions')}</p>}
                </ul>
            </div>
        </div>
    );
};

export default ActivitiesView;