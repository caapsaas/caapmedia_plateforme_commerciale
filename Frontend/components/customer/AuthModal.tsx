import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import { ContactRegisterData } from '../../services/apiCrm/apicontacts';
import { ContactStatus } from '../../types';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (email: string, password: string) => Promise<'SUCCESS' | 'NOT_VERIFIED' | 'FAILED'>;
    onRegister: (data: ContactRegisterData) => void;
    onAuthSuccess: () => void;
    onVerifyAccount?: (email: string) => void; // Rendu optionnel
    subsidiaryId: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onRegister, onAuthSuccess, onVerifyAccount, subsidiaryId }) => {
    const { t } = useI18n();
    const [view, setView] = useState<'login' | 'signup' | 'forgotPassword'>('login');
    const [error, setError] = useState('');
    const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);

    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [signupData, setSignupData] = useState({
        contactName: '',
        company: '',
        email: '',
        phone: '',
        password: '',
        address: '',
    });

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSignupData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setShowVerificationPrompt(false);
        const result = await onLogin(loginData.email, loginData.password);
        if (result === 'SUCCESS') {
            onAuthSuccess();
        } else if (result === 'NOT_VERIFIED') {
            setShowVerificationPrompt(true);
        } else {
            setError('Email ou mot de passe incorrect.');
        }
    };
    
    const handleSignupSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (signupData.password !== (document.getElementById('confirmPassword') as HTMLInputElement).value) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        const fullSignupData: ContactRegisterData = {
            ...signupData,
            since: new Date().toISOString(),
            isVerified: false, 
            subsidiaryId: subsidiaryId,
        };
        onRegister(fullSignupData);
        onAuthSuccess();
    };
    
    const handleVerifyClick = () => {
        if (onVerifyAccount) {
            onVerifyAccount(loginData.email);
            setShowVerificationPrompt(false);
            setError("Compte vérifié ! Vous pouvez maintenant vous connecter.");
        }
    };

    const handleForgotPassword = () => {
        setError('');
        setResetEmail('');
        setResetSent(false);
        setView('forgotPassword');
    };
    
    const handleForgotPasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        // Simulate API call
        console.log(`Password reset requested for ${resetEmail}`);
        setResetSent(true);
    };

    const switchView = (newView: 'login' | 'signup') => {
        setError('');
        setShowVerificationPrompt(false);
        setView(newView);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                {view !== 'forgotPassword' && (
                    <div className="flex border-b">
                        <button onClick={() => switchView('login')} className={`flex-1 py-3 font-semibold text-center ${view === 'login' ? 'text-[#c6e911] border-b-2 border-[#c6e911]' : 'text-slate-500'}`}>{t('customerAccount.login')}</button>
                        <button onClick={() => switchView('signup')} className={`flex-1 py-3 font-semibold text-center ${view === 'signup' ? 'text-[#c6e911] border-b-2 border-[#c6e911]' : 'text-slate-500'}`}>{t('customerAccount.signup')}</button>
                    </div>
                )}
                
                {view === 'login' && (
                    <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
                        <h3 className="text-xl font-bold text-center">{t('customerAccount.loginTitle')}</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t('customerAccount.email')}</label>
                            <input type="email" name="email" value={loginData.email} onChange={handleLoginChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t('customerAccount.password')}</label>
                            <input type="password" name="password" value={loginData.password} onChange={handleLoginChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]"/>
                        </div>
                        <div className="text-right text-sm">
                            <button type="button" onClick={handleForgotPassword} className="font-medium text-[#c6e911] hover:text-[#adc40f]">{t('login.forgotPassword')}</button>
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        {showVerificationPrompt && (
                            <div className="p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md text-sm text-center">
                                <p>Votre compte n'est pas activé.</p>
                                <button type="button" onClick={handleVerifyClick} className="font-bold underline mt-1">Cliquez ici pour vérifier votre compte.</button>
                            </div>
                        )}
                        <button type="submit" className="w-full py-3 bg-[#c6e911] text-slate-800 font-bold rounded-lg hover:bg-[#adc40f]">{t('customerAccount.loginAction')}</button>
                    </form>
                )}
                {view === 'signup' && (
                    <form onSubmit={handleSignupSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-center">{t('customerAccount.signupTitle')}</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t('customerAccount.name')}</label> 
                            <input type="text" name="contactName" value={signupData.contactName} onChange={handleSignupChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">{t('configuration.form.company')}</label>
                            <input type="text" name="company" value={signupData.company} onChange={handleSignupChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">{t('customerAccount.email')}</label>
                            <input type="email" name="email" value={signupData.email} onChange={handleSignupChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t('configuration.form.phone')}</label>
                            <input type="tel" name="phone" value={signupData.phone} onChange={handleSignupChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">{t('customerAccount.address')}</label>
                            <input type="text" name="address" value={signupData.address} onChange={handleSignupChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">{t('customerAccount.password')}</label>
                            <input type="password" name="password" value={signupData.password} onChange={handleSignupChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">{t('customerAccount.confirmPassword')}</label>
                            <input type="password" id="confirmPassword" required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]"/>
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <button type="submit" className="w-full py-3 bg-[#c6e911] text-slate-800 font-bold rounded-lg hover:bg-[#adc40f]">{t('customerAccount.signupAction')}</button>
                    </form>
                )}
                 {view === 'forgotPassword' && (
                    <form onSubmit={handleForgotPasswordSubmit} className="p-6 space-y-4">
                        <h3 className="text-xl font-bold text-center">{t('forgotPassword.title')}</h3>
                        {resetSent ? (
                            <div className="text-center p-4 bg-green-100 text-green-800 rounded-md">
                                <p>{t('forgotPassword.successMessage')}</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-slate-600 text-center">{t('forgotPassword.instruction')}</p>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{t('customerAccount.email')}</label>
                                    <input type="email" name="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]"/>
                                </div>
                                <button type="submit" className="w-full py-3 bg-[#c6e911] text-slate-800 font-bold rounded-lg hover:bg-[#adc40f]">{t('forgotPassword.sendLink')}</button>
                            </>
                        )}
                        <div className="text-center text-sm">
                            <button type="button" onClick={() => { setView('login'); setResetSent(false); }} className="font-medium text-[#c6e911] hover:text-[#adc40f]">{t('forgotPassword.backToLogin')}</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AuthModal;