

import React, { useState, useEffect } from 'react';
import { Opportunity, Contact, Product, OpportunityStage } from '../../types';
import { useI18n } from '../../i18n';

interface OpportunityFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Opportunity, 'id' | 'subsidiaryId' | 'userId'>) => void;
    opportunity: Opportunity | null;
    clients: Contact[];
    products: Product[];
}

const OpportunityFormModal: React.FC<OpportunityFormModalProps> = ({ isOpen, onClose, onSave, opportunity, clients, products }) => {
    const { t } = useI18n();
    const initialFormState: Omit<Opportunity, 'id' | 'subsidiaryId' | 'userId'> = {
        name: '',
        contactId: '',
        accountId: '',
        value: 0,
        stage: OpportunityStage.QUALIFICATION,
        products: [],
        closeDate: new Date().toISOString().split('T')[0],
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (opportunity) {
            const { id, subsidiaryId, userId, ...editableData } = opportunity;
            setFormData(editableData);
        } else {
            setFormData(initialFormState);
        }
    }, [opportunity, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'contactId') {
            const selectedClient = clients.find(c => c.id === value);
            setFormData(prev => ({ 
                ...prev, 
                contactId: value,
                accountId: selectedClient?.accountId || ''
            }));
        } else {
            const numValue = name === 'value' ? parseFloat(value) : value;
            setFormData(prev => ({ ...prev, [name]: numValue }));
        }
    };

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => products.find(p => p.id === option.value)).filter(Boolean) as Product[];
        setFormData(prev => ({ ...prev, products: selectedOptions }));
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
                            {opportunity ? t('crm.opportunity.modal.editTitle') : t('crm.opportunity.modal.addTitle')}
                        </h3>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">{t('crm.opportunity.form.name')}</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]" />
                            </div>
                            <div>
                                <label htmlFor="contactId" className="block text-sm font-medium text-slate-700">{t('crm.opportunity.form.client')}</label>
                                <select name="contactId" id="contactId" value={formData.contactId} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]">
                                    <option value="" disabled>{t('crm.opportunity.form.selectClient')}</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.contactName} - {c.company}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="value" className="block text-sm font-medium text-slate-700">{t('crm.opportunity.form.value')}</label>
                                <input type="number" name="value" id="value" value={formData.value} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]" />
                            </div>
                            <div>
                                <label htmlFor="stage" className="block text-sm font-medium text-slate-700">{t('crm.opportunity.form.stage')}</label>
                                <select name="stage" id="stage" value={formData.stage} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]">
                                    {Object.values(OpportunityStage).map(s => <option key={s} value={s}>{t(`crm.opportunity.stages.${s}`)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="products" className="block text-sm font-medium text-slate-700">{t('crm.opportunity.form.products')}</label>
                                <select name="products" id="products" multiple value={formData.products.map(p => p.id)} onChange={handleProductChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm h-24 focus:border-[#c6e911] focus:ring-[#c6e911]">
                                    <option value="" disabled>{t('crm.opportunity.form.selectProducts')}</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.productName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="closeDate" className="block text-sm font-medium text-slate-700">{t('crm.opportunity.form.closeDate')}</label>
                                <input type="date" name="closeDate" id="closeDate" value={formData.closeDate} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]" />
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

export default OpportunityFormModal;