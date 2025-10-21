import React, { useState } from 'react';
import { Contact } from '../../types';
import { useI18n } from '../../i18n';

interface ProfileViewProps {
    customer: Contact;
    onUpdateClient: (clientData: Partial<Contact>) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ customer, onUpdateClient }) => {
    const { t } = useI18n();
    const [formData, setFormData] = useState({
        name: customer.contactName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateClient(formData);
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">{t('customerAccount.personalInfo')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">{t('ecommerce.fullName')}</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">{t('ecommerce.email')}</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">{t('clients.phone')}</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">{t('ecommerce.deliveryAddress')}</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"/>
                </div>
                <div className="text-right">
                    <button type="submit" className="px-6 py-2 bg-[#c6e911] text-slate-800 font-bold rounded-lg hover:bg-[#adc40f]">
                        {t('customerAccount.saveChanges')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileView;