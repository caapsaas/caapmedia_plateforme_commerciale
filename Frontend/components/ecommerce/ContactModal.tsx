
import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import IconGmoLogo from '../icons/IconGmoLogo';
import IconCheckCircle from '../icons/IconCheckCircle';
import IconCancelX from '../icons/IconCancelX';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
    const { t } = useI18n();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        honeypot: '' // Anti-spam hidden field
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.honeypot) {
            return;
        }

        setIsSubmitting(true);

        const dataToSend = {
            ...formData,
            access_key: "6411e887-df29-4ab3-8a6d-3518bd9c09fe", // Votre clé d'accès
            subject: formData.subject || `Nouveau message de ${formData.name}`, // Sujet dynamique
        };

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(dataToSend),
            });

            const result = await response.json();

            if (result.success) {
                setIsSuccess(true);
                setFormData({ name: '', email: '', phone: '', subject: '', message: '', honeypot: '' }); // Reset form
            } else {
                console.error("Erreur Web3Forms:", result.message);
                // Vous pourriez afficher une erreur à l'utilisateur ici
            }
        } catch (error) {
            console.error("Erreur lors de l'envoi du formulaire:", error);
            // Gérer les erreurs réseau
        } finally {
            setIsSubmitting(false);
            setTimeout(() => {
                onClose();
                // La réinitialisation de isSuccess se fait déjà dans le setTimeout de fermeture
                // mais on peut s'assurer qu'il est bien à false après la fermeture.
                setTimeout(() => setIsSuccess(false), 500);
            }, 3000); // Laisse le message de succès visible 3 secondes
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh] animate-slideIn" 
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors z-10"
                    aria-label={t('common.close')}
                >
                    <IconCancelX className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="p-8 pb-4 border-b border-slate-100 text-center bg-slate-50/50">
                    <IconGmoLogo className="h-16 w-auto mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800">{t('contactModal.title')}</h2>
                    <p className="text-slate-500 mt-2 text-sm">{t('contactModal.subtitle')}</p>
                </div>

                {isSuccess ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                        <div className="bg-green-100 p-4 rounded-full mb-4 animate-bounce">
                            <IconCheckCircle className="h-16 w-16 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('contactModal.successTitle')}</h3>
                        <p className="text-slate-600 leading-relaxed">{t('contactModal.successMessage')}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-4 overflow-y-auto">
                        {/* Honeypot Field (Hidden) */}
                        <div className="hidden" aria-hidden="true">
                            <label htmlFor="honeypot">Don't fill this field</label>
                            <input type="text" id="honeypot" name="honeypot" value={formData.honeypot} onChange={handleChange} tabIndex={-1} autoComplete="off" />
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">{t('contactModal.name')} <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                id="name" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-all outline-none"
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">{t('contactModal.email')} <span className="text-red-500">*</span></label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    required 
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-all outline-none"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1">{t('contactModal.phone')}</label>
                                <input 
                                    type="tel" 
                                    id="phone" 
                                    name="phone" 
                                    value={formData.phone} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-all outline-none"
                                    placeholder="+237..."
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-1">{t('contactModal.subject')}</label>
                            <input 
                                type="text" 
                                id="subject" 
                                name="subject" 
                                value={formData.subject} 
                                onChange={handleChange} 
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-all outline-none"
                                placeholder="Demande d'information..."
                            />
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-1">{t('contactModal.message')} <span className="text-red-500">*</span></label>
                            <textarea 
                                id="message" 
                                name="message" 
                                value={formData.message} 
                                onChange={handleChange} 
                                required 
                                rows={4} 
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-all outline-none resize-none"
                                placeholder="Bonjour, je souhaiterais..."
                            ></textarea>
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full py-3.5 bg-[#c6e911] text-slate-900 font-bold rounded-lg hover:bg-[#adc40f] transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform active:scale-[0.98] duration-200"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-slate-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('contactModal.sending')}
                                    </>
                                ) : t('common.send')}
                            </button>
                        </div>

                        <div className="text-center pt-2">
                            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                                {t('contactModal.securityNote')}
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ContactModal;
