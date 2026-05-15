import React, { useState, useEffect } from 'react';
import { Contact, ContactStatus } from '../../types';
import { useI18n } from '../../i18n';
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon, CheckCircleIcon } from 'lucide-react';

interface ContactFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (client: Omit<Contact, 'id' | 'subsidiaryId'> & { id?: string }) => Promise<{ tempPassword?: string; message?: string } | void>;
    contact: Contact | null;
    isCreating?: boolean;
}

const ContactFormModal: React.FC<ContactFormModalProps> = ({ isOpen, onClose, onSave, contact, isCreating = false }) => {
    const { t } = useI18n();
    const [showPassword, setShowPassword] = useState(false);
    const [createdAccountInfo, setCreatedAccountInfo] = useState<{ email: string; tempPassword: string; message: string } | null>(null);
    
    const initialFormState = { 
        contactName: '',
        company: '',
        email: '',
        phone: '',
        since: new Date().toISOString().split('T')[0],
        address: '',
        isVerified: true,
        status: ContactStatus.PROSPECT,
        salesRepId: '',
    };
    const [formData, setFormData] = useState<Omit<Contact, 'id' | 'subsidiaryId'>>(initialFormState);

    useEffect(() => {
        if (contact) {
            const { id, subsidiaryId, ...editableData } = contact;
            setFormData(editableData);
        } else {
            setFormData(initialFormState);
        }
        setCreatedAccountInfo(null); // Réinitialiser les infos de compte à chaque ouverture
    }, [contact, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await onSave(formData);
            // Si le résultat contient un mot de passe temporaire, c'est qu'un compte a été créé
            if (result && result.tempPassword) {
                setCreatedAccountInfo({
                    email: formData.email,
                    tempPassword: result.tempPassword,
                    message: result.message || 'Compte créé avec succès'
                });
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // TODO: Afficher une notification de confirmation
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">
                                {contact ? t('configuration.modal.editClientTitle') : t('configuration.modal.addClientTitle')}
                            </h3>
                            {isCreating && (
                                <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                    <LockIcon className="w-4 h-4 mr-1" />
                                    Compte auto-créé
                                </div>
                            )}
                        </div>
                        
                        {createdAccountInfo && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start">
                                    <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 mr-2" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-green-800">{createdAccountInfo.message}</h4>
                                        <p className="text-sm text-green-700 mt-1">Un email a été envoyé au client avec ses identifiants.</p>
                                        
                                        <div className="mt-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-green-700">Email:</span>
                                                <div className="flex items-center">
                                                    <code className="text-xs bg-green-100 px-2 py-1 rounded">{createdAccountInfo.email}</code>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(createdAccountInfo.email)}
                                                        className="ml-2 text-green-600 hover:text-green-800"
                                                    >
                                                        <MailIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-green-700">Mot de passe temporaire:</span>
                                                <div className="flex items-center">
                                                    <code className="text-xs bg-green-100 px-2 py-1 rounded">
                                                        {showPassword ? createdAccountInfo.tempPassword : '••••••••'}
                                                    </code>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="ml-2 text-green-600 hover:text-green-800"
                                                    >
                                                        {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(createdAccountInfo.tempPassword)}
                                                        className="ml-2 text-green-600 hover:text-green-800"
                                                    >
                                                        <MailIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="contactName" className="block text-sm font-medium text-slate-700">{t('configuration.form.name')}</label>
                                <input type="text" name="contactName" id="contactName" value={formData.contactName} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="company" className="block text-sm font-medium text-slate-700">{t('configuration.form.company')}</label>
                                <input type="text" name="company" id="company" value={formData.company} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700">{t('configuration.form.email')}</label>
                                <div className="relative">
                                    <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm pr-8" />
                                    <MailIcon className="absolute right-2 top-2.5 w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">{t('configuration.form.phone')}</label>
                                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-slate-700">{t('configuration.form.address')}</label>
                                <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-slate-700">{t('crm.contacts.status')}</label>
                                <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border">
                                    {Object.values(ContactStatus).map(s => <option key={s} value={s}>{t(`crm.contacts.statuses.${s}`)}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-between items-center rounded-b-lg">
                        <div className="text-xs text-slate-500">
                            {isCreating && "Un compte sera automatiquement créé pour ce client"}
                        </div>
                        <div className="flex space-x-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                            <button type="submit" className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors">{t('common.save')}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContactFormModal;
