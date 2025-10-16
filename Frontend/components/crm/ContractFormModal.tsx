import React, { useState, useEffect } from 'react';
import { Contract, ContractStatus, Contact } from '../../types';
import { useI18n } from '../../i18n';

interface ContractFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Contract, 'id' | 'subsidiaryId'>) => void;
    contract: Contract | null;
    contacts: Contact[];
}

const ContractFormModal: React.FC<ContractFormModalProps> = ({ isOpen, onClose, onSave, contract, contacts }) => {
    const { t } = useI18n();
    const initialFormState: Omit<Contract, 'id' | 'subsidiaryId'> = {
        title: '',
        clientId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        amount: 0,
        status: ContractStatus.DRAFT,
    };
    
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (contract) {
            const { id, subsidiaryId, ...editableData } = contract;
            setFormData(editableData);
        } else {
            setFormData(initialFormState);
        }
    }, [contract, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numValue = name === 'amount' ? parseFloat(value) : value;
        setFormData(prev => ({ ...prev, [name]: numValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            {contract ? t('crm.contracts.modal.editTitle') : t('crm.contracts.modal.addTitle')}
                        </h3>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-slate-700">{t('crm.contracts.table.title')}</label>
                                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                             <div>
                                <label htmlFor="clientId" className="block text-sm font-medium text-slate-700">{t('crm.contracts.table.client')}</label>
                                <select name="clientId" id="clientId" value={formData.clientId} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                    <option value="" disabled>Select a client</option>
                                    {contacts.map(c => <option key={c.id} value={c.id}>{c.contactName}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">{t('crm.contracts.table.startDate')}</label>
                                    <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">{t('crm.contracts.table.endDate')}</label>
                                    <input type="date" name="endDate" id="endDate" value={formData.endDate} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-slate-700">{t('crm.contracts.table.amount')}</label>
                                <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-slate-700">{t('crm.contracts.table.status')}</label>
                                <select name="status" id="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                    {Object.values(ContractStatus).map(s => <option key={s} value={s}>{t(`crm.contracts.status_${s}`)}</option>)}
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

export default ContractFormModal;