import React, { useState, useEffect } from 'react';
import { SecretariatTask, SecretariatTaskStatus, Subsidiary, Employee } from '../../types';
import { useI18n } from '../../i18n';
import { SaveSecretariatTaskDto } from '../../services/apisecretariat/apiSecretariat';

interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: SaveSecretariatTaskDto) => void;
    task: SecretariatTask | null;
    subsidiary: Subsidiary; 
    employees: Employee[];
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSave, task, subsidiary, employees }) => {
    const { t } = useI18n();
    const initialFormState = {
        title: '',
        description: '',
        assignedToId: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: SecretariatTaskStatus.TODO,
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.description,
                assignedToId: task.assignedToId,
                dueDate: task.dueDate,
                status: task.status,
            });
        } else {
            setFormData(initialFormState);
        }
    }, [task, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: task?.id, subsidiaryId: subsidiary.id, ...formData });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            {task ? t('secretariat.tasks.modal.editTitle') : t('secretariat.tasks.modal.addTitle')}
                        </h3>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-slate-700">{t('secretariat.tasks.table.title')}</label>
                                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                             <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-700">{t('configuration.form.description')}</label>
                                <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"></textarea>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="assignedToId" className="block text-sm font-medium text-slate-700">{t('secretariat.tasks.table.assignedTo')}</label>
                                    <select name="assignedToId" id="assignedToId" value={formData.assignedToId} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        <option value="" disabled>Select an employee</option>
                                        {employees.map(emp => <option key={emp.id} value={emp.id}>{`${emp.firstName} ${emp.lastName}`}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700">{t('secretariat.tasks.table.dueDate')}</label>
                                    <input type="date" name="dueDate" id="dueDate" value={formData.dueDate} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-slate-700">{t('secretariat.tasks.table.status')}</label>
                                <select name="status" id="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                    {Object.values(SecretariatTaskStatus).map(s => <option key={s} value={s}>{t(`secretariat.tasks.statuses.${s}`)}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors">{t('common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskFormModal;