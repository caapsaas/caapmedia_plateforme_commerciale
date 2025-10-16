import React, { useState } from 'react';
import { Equipment } from '../../types';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import { CreateMaintenanceRecordDto } from '../../services/apiMaintenance/apiMaintenance_record';

interface MaintenanceLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    equipment: Equipment;
    onAddLog: (data: CreateMaintenanceRecordDto) => void;
}

const MaintenanceLogModal: React.FC<MaintenanceLogModalProps> = ({ isOpen, onClose, equipment, onAddLog }) => {
    const { t, formatCurrency } = useI18n();
    const [showAddForm, setShowAddForm] = useState(false);
    const initialFormState = {
        maintenanceDate: new Date().toISOString().split('T')[0],
        technician: '',
        description: '',
        maintenanceCost: 0,
    };
    const [newLog, setNewLog] = useState(initialFormState);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const numValue = name === 'maintenanceCost' ? parseFloat(value) || 0 : value;
        setNewLog(prev => ({ ...prev, [name]: numValue }));
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddLog({ equipmentId: equipment.id, ...newLog });
        setNewLog(initialFormState);
        setShowAddForm(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-lg font-bold text-slate-900">{t('maintenance.modal.logTitle', { name: equipment.name })}</h3>
                </div>
                <div className="p-6 overflow-y-auto flex-grow">
                    {!showAddForm && (
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold">{t('maintenance.history')}</h4>
                            <button onClick={() => setShowAddForm(true)} className="flex items-center space-x-2 px-3 py-1.5 bg-[#c6e911] text-slate-800 text-xs font-semibold rounded-md hover:bg-[#adc40f]">
                                <IconPlus className="h-4 w-4" />
                                <span>{t('maintenance.logMaintenance')}</span>
                            </button>
                        </div>
                    )}
                    
                    {showAddForm ? (
                        <form onSubmit={handleAddSubmit} className="space-y-4 p-4 bg-slate-50 rounded-lg">
                            <div>
                                <label htmlFor="maintenanceDate" className="block text-sm font-medium text-slate-700">{t('maintenance.form.maintenanceDate')}</label>
                                <input type="date" name="maintenanceDate" value={newLog.maintenanceDate} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm" />
                            </div>
                             <div>
                                <label htmlFor="technician" className="block text-sm font-medium text-slate-700">{t('maintenance.form.technician')}</label>
                                <input type="text" name="technician" value={newLog.technician} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm" />
                            </div>
                             <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-700">{t('maintenance.form.description')}</label>
                                <textarea name="description" value={newLog.description} onChange={handleChange} required rows={3} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"></textarea>
                            </div>
                             <div>
                                <label htmlFor="maintenanceCost" className="block text-sm font-medium text-slate-700">{t('maintenance.form.cost')}</label>
                                <input type="number" name="maintenanceCost" value={newLog.maintenanceCost} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm" />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md">{t('common.cancel')}</button>
                                <button type="submit" className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md">{t('common.save')}</button>
                            </div>
                        </form>
                    ) : (
                        <ul className="space-y-3">
                            {equipment.maintenanceHistory.map(record => (
                                <li key={record.id} className="text-sm border-l-4 border-slate-200 pl-4">
                                    <p className="font-semibold">{record.maintenanceDate} - <span className="text-slate-600">{record.technician}</span></p>
                                    <p className="text-slate-800">{record.description}</p>
                                    <p className="text-xs text-slate-500 font-medium">Coût: {formatCurrency(record.maintenanceCost)}</p>
                                </li>
                            ))}
                            {equipment.maintenanceHistory.length === 0 && <p>Aucun historique de maintenance.</p>}
                        </ul>
                    )}
                </div>
                 <div className="px-6 py-4 bg-slate-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300">
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceLogModal;
