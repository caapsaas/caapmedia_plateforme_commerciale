import React, { useState } from 'react';
import { useI18n } from '../../i18n';

const SecurityView: React.FC = () => {
    const { t } = useI18n();
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: '',
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would call a function to update password
        if (passwords.new !== passwords.confirm) {
            alert("New passwords don't match!");
            return;
        }
        alert('Password changed successfully (simulation)!');
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">{t('customerAccount.changePassword')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                 <div>
                    <label className="block text-sm font-medium text-slate-700">{t('customerAccount.currentPassword')}</label>
                    <input type="password" name="current" value={passwords.current} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">{t('customerAccount.newPassword')}</label>
                    <input type="password" name="new" value={passwords.new} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">{t('customerAccount.confirmPassword')}</label>
                    <input type="password" name="confirm" value={passwords.confirm} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"/>
                </div>
                <div className="text-right pt-2">
                    <button type="submit" className="px-6 py-2 bg-[#c6e911] text-slate-800 font-bold rounded-lg hover:bg-[#adc40f]">
                        {t('customerAccount.changePassword')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SecurityView;