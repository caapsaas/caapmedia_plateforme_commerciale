import React, { useState } from 'react';
import { Contact } from '../../types';
import { useI18n } from '../../i18n';
import { LockIcon, MailIcon, EyeIcon, EyeOffIcon, CheckCircleIcon } from 'lucide-react';

interface ContactAccountActionsProps {
    contact: Contact;
    onResetPassword: (contactId: string) => Promise<{ tempPassword: string; message: string }>;
    onEnablePortal: (contactId: string) => Promise<{ tempPassword: string; message: string }>;
}

const ContactAccountActions: React.FC<ContactAccountActionsProps> = ({ 
    contact, 
    onResetPassword, 
    onEnablePortal 
}) => {
    const { t } = useI18n();
    const [showPassword, setShowPassword] = useState(false);
    const [actionResult, setActionResult] = useState<{ tempPassword: string; message: string; type: 'reset' | 'enable' } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async () => {
        setIsLoading(true);
        try {
            const result = await onResetPassword(contact.id);
            setActionResult({ ...result, type: 'reset' });
            setShowPassword(false);
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
            // TODO: Afficher une notification d'erreur
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnablePortal = async () => {
        setIsLoading(true);
        try {
            const result = await onEnablePortal(contact.id);
            setActionResult({ ...result, type: 'enable' });
            setShowPassword(false);
        } catch (error) {
            console.error('Erreur lors de l\'activation du portail:', error);
            // TODO: Afficher une notification d'erreur
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // TODO: Afficher une notification de confirmation
    };

    const hasAccount = !!contact.password;

    return (
        <div className="space-y-4">
            {/* Statut du compte */}
            <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">Statut du compte client</h4>
                <div className="flex items-center space-x-2">
                    {hasAccount ? (
                        <>
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                            <span className="text-sm text-green-700">Compte activé</span>
                        </>
                    ) : (
                        <>
                            <LockIcon className="w-5 h-5 text-slate-400" />
                            <span className="text-sm text-slate-600">Compte non activé</span>
                        </>
                    )}
                </div>
            </div>

            {/* Actions disponibles */}
            <div className="flex flex-col space-y-2">
                {hasAccount ? (
                    <button
                        onClick={handleResetPassword}
                        disabled={isLoading}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                    >
                        <MailIcon className="w-4 h-4 mr-2" />
                        {isLoading ? 'Traitement...' : 'Réinitialiser le mot de passe'}
                    </button>
                ) : (
                    <button
                        onClick={handleEnablePortal}
                        disabled={isLoading}
                        className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 transition-colors"
                    >
                        <LockIcon className="w-4 h-4 mr-2" />
                        {isLoading ? 'Traitement...' : 'Activer l\'accès au portail'}
                    </button>
                )}
            </div>

            {/* Résultat de l'action */}
            {actionResult && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 mr-2" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-green-800">
                                {actionResult.type === 'reset' ? 'Mot de passe réinitialisé' : 'Accès au portail activé'}
                            </h4>
                            <p className="text-sm text-green-700 mt-1">{actionResult.message}</p>
                            
                            <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-green-700">Email:</span>
                                    <div className="flex items-center">
                                        <code className="text-xs bg-green-100 px-2 py-1 rounded">{contact.email}</code>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(contact.email)}
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
                                            {showPassword ? actionResult.tempPassword : '••••••••'}
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
                                            onClick={() => copyToClipboard(actionResult.tempPassword)}
                                            className="ml-2 text-green-600 hover:text-green-800"
                                        >
                                            <MailIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-3 text-xs text-green-600">
                                Un email a été envoyé au client avec ses nouveaux identifiants.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                <p className="font-medium mb-1">Instructions:</p>
                <ul className="space-y-1">
                    <li>• Le client recevra un email avec ses identifiants de connexion</li>
                    <li>• Le mot de passe temporaire doit être changé lors de la première connexion</li>
                    <li>• Le client pourra accéder à son portail pour consulter ses commandes et informations</li>
                </ul>
            </div>
        </div>
    );
};

export default ContactAccountActions;
