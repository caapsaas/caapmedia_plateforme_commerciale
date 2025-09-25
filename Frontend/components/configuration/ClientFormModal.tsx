import React, { useState, useEffect } from 'react';
import { Contact, ContactStatus } from '../../types';
import { useI18n } from '../../i18n';

interface ClientFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (client: Omit<Contact, 'id' | 'subsidiaryId'> & { id?: string }) => void;
    client: Contact | null;
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, onSave, client }) => {
    const { t } = useI18n();
    const initialFormState = {
        name: '',
        company: '',
        email: '',
        phone: '',
        since: new Date().toISOString().split('T')[0],
        address: '',
        isVerified: true,
        status: ContactStatus.ACTIVE
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name,
                company: client.company,
                email: client.email,
                phone: client.phone,
                since: client.since,
                address: client.address,
                isVerified: client.isVerified,
                status: client.status || ContactStatus.ACTIVE,
            });
        } else {
            setFormData(initialFormState);
        }
    }, [client, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
             setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
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
                            {client ? t('configuration.modal.editClientTitle') : t('configuration.modal.addClientTitle')}
                        </h3>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">{t('configuration.form.name')}</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="company" className="block text-sm font-medium text-slate-700">{t('configuration.form.company')}</label>
                                <input type="text" name="company" id="company" value={formData.company} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700">{t('configuration.form.email')}</label>
                                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">{t('configuration.form.phone')}</label>
                                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-slate-700">{t('configuration.form.address')}</label>
                                <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="since" className="block text-sm font-medium text-slate-700">{t('configuration.form.since')}</label>
                                <input type="date" name="since" id="since" value={formData.since} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                             <div className="flex items-center">
                                <input id="isVerified" name="isVerified" type="checkbox" checked={formData.isVerified} onChange={handleChange} className="h-4 w-4 text-[#c6e911] focus:ring-lime-400 border-gray-300 rounded" />
                                <label htmlFor="isVerified" className="ml-2 block text-sm text-slate-900">Compte vérifié</label>
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

export default ClientFormModal;