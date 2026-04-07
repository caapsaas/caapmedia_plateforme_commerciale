import React, { useState, useEffect } from 'react';
import { User, UserRole, Subsidiary } from '../../types';
import { useI18n } from '../../i18n';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: Omit<User, 'id'> & { id?: string }) => void;
    user: User | null;
    subsidiaries: Subsidiary[];
    currentSubsidiaryId: string;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, user, subsidiaries, currentSubsidiaryId }) => {
    const { t } = useI18n();
    const initialFormState = {
        userName: '', // Changed from 'name' to 'userName'
        email: '',
        userRole: UserRole.COMMERCIAL, // Changed from 'role' to 'userRole'
        subsidiaryId: currentSubsidiaryId || (subsidiaries.length > 0 ? subsidiaries[0].id : ''),
    };
    // Le type de l'état est ajusté pour correspondre à la structure de `initialFormState`.
    // L'erreur TypeScript provient du décalage entre `Omit<User, 'id' | 'password'>` (qui attend `name` et `rolet`)
    // et `initialFormState` (qui utilise `userName` et `userRole`).
    const [formData, setFormData] = useState(initialFormState);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswordFields, setShowPasswordFields] = useState(!user);
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                userName: user.userName,
                email: user.email,
                userRole: user.userRole,
                subsidiaryId: user.subsidiaryId || currentSubsidiaryId || (subsidiaries.length > 0 ? subsidiaries[0].id : ''),
            });
        } else {
            setFormData(initialFormState);
        }
        setPassword('');
        setConfirmPassword('');
        setShowPasswordFields(!user);
        setPasswordError('');
    }, [user, isOpen, currentSubsidiaryId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (showPasswordFields) {
            if (!user && !password) { // Password required for new user
                setPasswordError(t('configuration.form.passwordRequired'));
                return;
            }
            if (password !== confirmPassword) {
                setPasswordError(t('configuration.form.passwordsDoNotMatch'));
                return;
            }
        }

        // Validation pour les nouveaux utilisateurs uniquement
        if (!user && (!formData.subsidiaryId || formData.subsidiaryId.trim() === '')) {
            setPasswordError(t('login.errorSelectSubsidiary'));
            return;
        }

        let saveData: any = {};
        
        // N'inclure que les champs qui ont changé
        if (formData.userName !== user?.userName) {
            saveData.userName = formData.userName;
        }
        if (formData.email !== user?.email) {
            saveData.email = formData.email;
        }
        if (formData.userRole !== user?.userRole) {
            saveData.userRole = formData.userRole;
        }
        if (showPasswordFields && password) {
            saveData.password = password;
        }

        // Pour un nouvel utilisateur, inclure tous les champs
        if (!user) {
            saveData = {
                userName: formData.userName,
                email: formData.email,
                userRole: formData.userRole,
                subsidiaryId: formData.subsidiaryId,
                ...(password ? { password } : {})
            };
        } else {
            // Mode édition : toujours inclure l'ID
            saveData.id = user.id;
            
            // Inclure uniquement les champs qui ont changé
            if (formData.userName !== user?.userName) {
                saveData.userName = formData.userName;
            }
            if (formData.email !== user?.email) {
                saveData.email = formData.email;
            }
            if (formData.userRole !== user?.userRole) {
                saveData.userRole = formData.userRole;
            }
            if (formData.subsidiaryId !== user?.subsidiaryId) {
                saveData.subsidiaryId = formData.subsidiaryId;
            }
            if (showPasswordFields && password) {
                saveData.password = password;
            }
        }

        // En mode édition, si seul l'ID est présent (aucun changement), fermer le modal
        if (user && Object.keys(saveData).length === 1) { // Juste l'ID
            onClose();
            return;
        }

        onSave(saveData);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            {user ? t('configuration.modal.editUserTitle') : t('configuration.modal.addUserTitle')}
                        </h3>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="userName" className="block text-sm font-medium text-slate-700">{t('configuration.form.name')}</label>
                                <input type="text" name="userName" id="userName" value={formData.userName} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700">{t('configuration.form.email')}</label>
                                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div> 
                                    <label htmlFor="userRole" className="block text-sm font-medium text-slate-700">{t('configuration.form.role')}</label>
                                    <select name="userRole" id="userRole" value={formData.userRole} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        {Object.values(UserRole).map(roleValue => (
                                            <option key={roleValue} value={roleValue}>{t(`roles.${roleValue}`)}</option>
                                        ))}
                                    </select>
                                </div>
                                 <div>
                                    <label htmlFor="subsidiaryId" className="block text-sm font-medium text-slate-700">Filiale</label>
                                    <select name="subsidiaryId" id="subsidiaryId" value={formData.subsidiaryId} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        {subsidiaries.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                             {user && !showPasswordFields && (
                                <div className="pt-2">
                                    <button type="button" onClick={() => setShowPasswordFields(true)} className="text-sm font-medium text-[#c6e911] hover:text-[#adc40f]">
                                        Réinitialiser le mot de passe
                                    </button>
                                </div>
                            )}

                             {showPasswordFields && (
                                <>
                                    <hr className="my-2"/>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">{user ? 'Nouveau mot de passe' : 'Mot de passe'}</label>
                                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!user} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
                                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required={!user} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                </>
                            )}
                            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
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

export default UserFormModal;