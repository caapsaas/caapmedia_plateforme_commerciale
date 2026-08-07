import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Subsidiary, SecretariatTask, SecretariatTaskStatus, Employee } from '../../types';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import TaskFormModal from './TaskFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';
import { SaveSecretariatTaskDto, getSecretariatTasks, getSecretariatTasksPaginated } from '../../services/apisecretariat/apiSecretariat';
import EmptyState from '../ui/EmptyState';
import TableSkeleton from '../ui/TableSkeleton';
import Pagination from '../common/Pagination';

const TASKS_PAGE_SIZE = 10;

// `task.dueDate` était affiché brut (ISO) au lieu d'une date localisée.
const fmtDate = (date?: string | null, language = 'fr') => {
    if (!date) return '—';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(language);
};

interface TaskManagementProps {
    subsidiary: Subsidiary;
    employees: Employee[];
    onSave: (data: SaveSecretariatTaskDto) => void;
    onDelete: (id: string) => void;
}

const TaskManagement: React.FC<TaskManagementProps> = ({ subsidiary, employees, onSave, onDelete }) => {
    const { t, language } = useI18n();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<SecretariatTask | null>(null);
    const [deletingTask, setDeletingTask] = useState<SecretariatTask | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const { data: paginatedTasks, isLoading } = useQuery({
        queryKey: ['secretariatTasks', subsidiary.id, 'paginated', page, search],
        queryFn: () => getSecretariatTasksPaginated({ page, limit: TASKS_PAGE_SIZE, search: search || undefined }),
    });

    const tasks = paginatedTasks?.data || [];
    const meta = paginatedTasks?.meta;

    const handleOpenAddModal = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (task: SecretariatTask) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (task: SecretariatTask) => {
        setDeletingTask(task);
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setDeletingTask(null);
    };

    const handleSaveTask = (data: SaveSecretariatTaskDto) => {
        onSave(data);
        handleCloseModals();
    };

    const handleDeleteTask = () => {
        if (deletingTask) {
            onDelete(deletingTask.id);
            handleCloseModals();
        }
    };
    
    const getAssigneeName = (id: string) => {
        const employee = employees.find(e => e.id === id);
        return employee ? `${employee.firstName} ${employee.lastName}`: 'N/A';
    }

    const getStatusClass = (status: SecretariatTaskStatus) => {
        switch (status) {
            case SecretariatTaskStatus.TODO: return 'bg-gray-200 text-gray-800';
            case SecretariatTaskStatus.IN_PROGRESS: return 'bg-blue-200 text-blue-800';
            case SecretariatTaskStatus.DONE: return 'bg-green-200 text-green-800';
            default: return 'bg-slate-200 text-slate-800';
        }
    };

    const handleStatusChange = (taskId: string, newStatus: SecretariatTaskStatus) => {
        onSave({ id: taskId, status: newStatus });
    };

    const handlePrint = () => window.print();

    const buildExportHeaders = () => [
        { key: 'title', label: t('secretariat.tasks.table.title') },
        { key: 'assignedTo', label: t('secretariat.tasks.table.assignedTo') },
        { key: 'dueDate', label: t('secretariat.tasks.table.dueDate') },
        { key: 'status', label: t('secretariat.tasks.table.status') },
    ];

    // L'export porte sur l'ensemble des tâches (pas seulement la page
    // affichée) — on va chercher la liste complète à la demande plutôt que
    // de la garder en mémoire en permanence.
    const fetchAllForExport = async () => {
        const all = await getSecretariatTasks();
        return all.map(task => ({
            ...task,
            assignedTo: getAssigneeName(task.assignedToId),
            status: t(`secretariat.tasks.statuses.${task.status}`),
        }));
    };

    const handleExportCsv = async () => {
        setIsExporting(true);
        try {
            const data = await fetchAllForExport();
            exportToCsv('liste_taches', buildExportHeaders(), data);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            const data = await fetchAllForExport();
            exportToPdf(t('secretariat.tasks.title'), buildExportHeaders(), data, 'taches');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('secretariat.tasks.title')}</h3>
                <div className="flex items-center space-x-2 no-print">
                    <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                        <IconPlus className="h-4 w-4" />
                        <span>{t('secretariat.tasks.add')}</span>
                    </button>
                    <button onClick={handlePrint} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        <IconPrint className="h-4 w-4" />
                        <span>{t('common.print')}</span>
                    </button>
                    <button onClick={handleExportCsv} disabled={isExporting} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors disabled:opacity-50">
                        <IconExport className="h-4 w-4" />
                        <span>{t('common.export')}</span>
                    </button>
                    <button onClick={handleExportPdf} disabled={isExporting} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors disabled:opacity-50">
                        <IconPdf className="h-4 w-4" />
                        <span>{t('common.exportPdf')}</span>
                    </button>
                </div>
            </div>
            <div className="mb-4 no-print">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('common.search')}
                    className="w-full sm:w-72 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#c6e911]"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('secretariat.tasks.table.title')}</th>
                            <th scope="col" className="px-6 py-3">{t('secretariat.tasks.table.assignedTo')}</th>
                            <th scope="col" className="px-6 py-3">{t('secretariat.tasks.table.dueDate')}</th>
                            <th scope="col" className="px-6 py-3">{t('secretariat.tasks.table.status')}</th>
                            <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <TableSkeleton rows={TASKS_PAGE_SIZE} columns={5} />
                        ) : tasks.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <EmptyState icon="document" title={t('secretariat.tasks.title')} description={t('common.notAvailable')} />
                                </td>
                            </tr>
                        ) : tasks.map((task) => (
                            <tr key={task.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-slate-900">{task.title}</div>
                                    <div className="text-xs text-slate-500">{task.description}</div>
                                </td>
                                <td className="px-6 py-4">{getAssigneeName(task.assignedToId)}</td>
                                <td className="px-6 py-4">{fmtDate(task.dueDate, language)}</td>
                                <td className="px-6 py-4">
                                    <select 
                                        value={task.status} 
                                        onChange={(e) => handleStatusChange(task.id, e.target.value as SecretariatTaskStatus)}
                                        className={`w-full text-xs font-semibold rounded-md border-0 focus:ring-0 py-1 ${getStatusClass(task.status)}`}
                                    >
                                        {Object.values(SecretariatTaskStatus).map(s => (
                                            <option key={s} value={s}>{t(`secretariat.tasks.statuses.${s}`)}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-center space-x-1 no-print">
                                    <button onClick={() => handleOpenEditModal(task)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                        <IconEdit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenDeleteModal(task)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
                                        <IconDelete className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {meta && <Pagination meta={meta} onPageChange={setPage} />}

            {isModalOpen && (
                <TaskFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSaveTask}
                    task={editingTask}
                    subsidiary={subsidiary}
                    employees={employees}
                />
            )}

            {deletingTask && (
                <ConfirmationModal
                    isOpen={!!deletingTask}
                    onClose={handleCloseModals}
                    onConfirm={handleDeleteTask}
                    title={t('secretariat.tasks.modal.deleteTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: deletingTask.title })}
                />
            )}
        </div>
    );
};

export default TaskManagement;