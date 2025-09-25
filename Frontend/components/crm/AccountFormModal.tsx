import React, { useState, useEffect } from 'react';
import { Account } from '../../types';
import { useI18n } from '../../i18n';

interface AccountFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Account, 'id' | 'subsidiaryId'>) => void;
    account: Account | null;
}

const AccountFormModal: React.FC<AccountFormModalProps> = ({ isOpen, onClose, onSave, account }) => {
    const { t } = useI18n();
    const initialFormState: Omit<Account, 'id' | 'subsidiaryId'> = {
        name: '',
        industry: '',
        phone: '',
        address: '',
    };
    
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (account) {
            const { id, subsidiaryId, ...editableData } = account;
            setFormData(editableData);
        } else {
            setFormData(initialFormState);
        }
    }, [account, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                            {account ? t('crm.accounts.modal.editTitle') : t('crm.accounts.modal.addTitle')}
                        </h3>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">{t('crm.accounts.name')}</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="industry" className="block text-sm font-medium text-slate-700">{t('crm.accounts.industry')}</label>
                                <input type="text" name="industry" id="industry" value={formData.industry} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">{t('crm.accounts.phone')}</label>
                                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-slate-700">{t('crm.accounts.address')}</label>
                                <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
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

export default AccountFormModal;
