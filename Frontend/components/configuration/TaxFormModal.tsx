
import React, { useState, useEffect } from 'react';
import { TaxRate } from '../../types';
import { useI18n } from '../../i18n';

interface TaxFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taxData: Omit<TaxRate, 'id'> & { id?: string }) => void;
    taxRate: TaxRate | null;
}

const TaxFormModal: React.FC<TaxFormModalProps> = ({ isOpen, onClose, onSave, taxRate }) => {
    const { t } = useI18n();
    const initialFormState = {
        taxRatesName: '',
        rate: 0,
        isDefault: false,
        description: '',
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (taxRate) {
            setFormData({
                taxRatesName: taxRate.taxRatesName,
                rate: taxRate.rate,
                isDefault: taxRate.isDefault,
                description: taxRate.description || '',
            });
        } else {
            setFormData(initialFormState);
        }
    }, [taxRate, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'rate') {
            setFormData(prev => ({ ...prev, [name]: (parseFloat(value) || 0) / 100 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: taxRate?.id, ...formData });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            {taxRate ? t('configuration.modal.editTaxTitle') : t('configuration.modal.addTaxTitle')}
                        </h3>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="taxRatesName" className="block text-sm font-medium text-slate-700">{t('configuration.form.name')}</label>
                                <input type="text" name="taxRatesName" id="taxRatesName" value={formData.taxRatesName} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="rate" className="block text-sm font-medium text-slate-700">{t('configuration.form.rate')}</label>
                                <input type="number" step="0.01" name="rate" id="rate" value={formData.rate * 100} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                             <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-700">{t('configuration.form.description')}</label>
                                <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div className="flex items-center">
                                <input id="isDefault" name="isDefault" type="checkbox" checked={formData.isDefault} onChange={handleChange} disabled={taxRate?.isDefault} className="h-4 w-4 text-[#c6e911] focus:ring-lime-400 border-gray-300 rounded disabled:opacity-50" />
                                <label htmlFor="isDefault" className="ml-2 block text-sm text-slate-900">{t('configuration.form.isDefault')}</label>
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

export default TaxFormModal;
