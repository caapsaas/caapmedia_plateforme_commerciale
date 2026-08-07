import React, { useState, useEffect } from 'react';
import { Bank, BankType } from '../../types';
import { useI18n } from '../../i18n';

interface BankFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (bankData: Omit<Bank, 'id'> & { id?: string }) => void;
    bank: Bank | null;
}

const BankFormModal: React.FC<BankFormModalProps> = ({ isOpen, onClose, onSave, bank }) => {
    const { t } = useI18n();
    const initialFormState = {
        name: '',
        address: '',
        phone: '',
        type: BankType.COMMERCIAL_BANK,
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (bank) {
            setFormData({
                name: bank.name,
                address: bank.address,
                phone: bank.phone,
                type: bank.type,
            });
        } else {
            setFormData(initialFormState);
        }
    }, [bank, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: bank?.id, ...formData });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            {bank ? t('configuration.bank.editTitle') : t('configuration.bank.addTitle')}
                        </h3>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">{t('configuration.bank.name')}</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-slate-700">{t('configuration.form.address')}</label>
                                <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">{t('configuration.form.phone')}</label>
                                <input type="text" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-slate-700">{t('configuration.bank.type')}</label>
                                <select name="type" id="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm bg-white">
                                    <option value={BankType.COMMERCIAL_BANK}>{t('configuration.bank.types.COMMERCIAL_BANK')}</option>
                                    <option value={BankType.PUBLIC_BANK}>{t('configuration.bank.types.PUBLIC_BANK')}</option>
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

export default BankFormModal;
