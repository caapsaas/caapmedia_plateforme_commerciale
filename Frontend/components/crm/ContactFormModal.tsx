import React, { useState, useEffect } from 'react';
import { Contact, ContactStatus } from '../../types';
import { useI18n } from '../../i18n';

interface ContactFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (client: Omit<Contact, 'id' | 'subsidiaryId'> & { id?: string }) => void;
    contact: Contact | null;
}

const ContactFormModal: React.FC<ContactFormModalProps> = ({ isOpen, onClose, onSave, contact }) => {
    const { t } = useI18n();
    const initialFormState = {
        contactName: '',
        company: '',
        email: '',
        phone: '',
        since: new Date().toISOString().split('T')[0],
        address: '',
        isVerified: true,
        status: ContactStatus.PROSPECT,
        accountId: '',
        salesRepId: '',
        password: '' // Ajout de la propriété manquante
    };
    const [formData, setFormData] = useState<Omit<Contact, 'id' | 'subsidiaryId'>>(initialFormState);

    useEffect(() => {
        if (contact) {
            const { id, subsidiaryId, ...editableData } = contact;
            setFormData(editableData);
        } else {
            setFormData(initialFormState);
        }
    }, [contact, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
                            {contact ? t('configuration.modal.editClientTitle') : t('configuration.modal.addClientTitle')}
                        </h3>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="contactName" className="block text-sm font-medium text-slate-700">{t('configuration.form.name')}</label>
                                <input type="text" name="contactName" id="contactName" value={formData.contactName} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
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
                                <label htmlFor="status" className="block text-sm font-medium text-slate-700">{t('crm.contacts.status')}</label>
                                <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm">
                                    {Object.values(ContactStatus).map(s => <option key={s} value={s}>{t(`crm.contacts.statuses.${s}`)}</option>)}
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

export default ContactFormModal;
