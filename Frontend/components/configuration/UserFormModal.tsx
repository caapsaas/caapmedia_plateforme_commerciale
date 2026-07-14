import React, { useState, useEffect } from 'react';
import { User, UserRole, Subsidiary } from '../../types';
import { useI18n } from '../../i18n';

// SUPER_ADMIN n'est jamais attribuable depuis ce formulaire: c'est un role
// d'exception (vue consolidee toutes filiales) attribue manuellement en base,
// pas via la gestion courante des utilisateurs.
const ASSIGNABLE_ROLES = Object.values(UserRole).filter(r => r !== UserRole.SUPER_ADMIN);

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
        userName: '',
        email: '',
        userRole: UserRole.COMMERCIAL,
        additionalRoles: [] as UserRole[],
        subsidiaryId: currentSubsidiaryId || (subsidiaries.length > 0 ? subsidiaries[0].id : ''),
    };
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
                additionalRoles: user.additionalRoles ?? [],
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
        if (name === 'userRole') {
            // Remove the new primary role from additionalRoles if it was there
            setFormData(prev => ({
                ...prev,
                userRole: value as UserRole,
                additionalRoles: prev.additionalRoles.filter(r => r !== value),
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAdditionalRoleToggle = (role: UserRole) => {
        setFormData(prev => ({
            ...prev,
            additionalRoles: prev.additionalRoles.includes(role)
                ? prev.additionalRoles.filter(r => r !== role)
                : [...prev.additionalRoles, role],
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (showPasswordFields) {
            if (!user && !password) {
                setPasswordError(t('configuration.form.passwordRequired'));
                return;
            }
            if (password !== confirmPassword) {
                setPasswordError(t('configuration.form.passwordsDoNotMatch'));
                return;
            }
        }

        if (!user && (!formData.subsidiaryId || formData.subsidiaryId.trim() === '')) {
            setPasswordError(t('login.errorSelectSubsidiary'));
            return;
        }

        let saveData: any = {};

        if (!user) {
            saveData = {
                userName: formData.userName,
                email: formData.email,
                userRole: formData.userRole,
                additionalRoles: formData.additionalRoles,
                subsidiaryId: formData.subsidiaryId,
                ...(password ? { password } : {})
            };
        } else {
            saveData.id = user.id;
            if (formData.userName !== user.userName) saveData.userName = formData.userName;
            if (formData.email !== user.email) saveData.email = formData.email;
            if (formData.userRole !== user.userRole) saveData.userRole = formData.userRole;
            if (JSON.stringify(formData.additionalRoles) !== JSON.stringify(user.additionalRoles ?? [])) {
                saveData.additionalRoles = formData.additionalRoles;
            }
            if (formData.subsidiaryId !== user.subsidiaryId) saveData.subsidiaryId = formData.subsidiaryId;
            if (showPasswordFields && password) saveData.password = password;
        }

        if (user && Object.keys(saveData).length === 1) {
            onClose();
            return;
        }

        onSave(saveData);
    };

    if (!isOpen) return null;

    const secondaryRoles = ASSIGNABLE_ROLES.filter(r => r !== formData.userRole);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
                                    <label htmlFor="userRole" className="block text-sm font-medium text-slate-700">Rôle principal</label>
                                    {formData.userRole === UserRole.SUPER_ADMIN ? (
                                        // Cas d'un compte deja SUPER_ADMIN (attribue manuellement hors de
                                        // cette UI): affiche sans permettre de le changer ici, plutot que
                                        // de casser le select (SUPER_ADMIN n'est pas dans ASSIGNABLE_ROLES).
                                        <select disabled value={UserRole.SUPER_ADMIN} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm bg-slate-100 text-slate-500 sm:text-sm">
                                            <option value={UserRole.SUPER_ADMIN}>{t(`roles.${UserRole.SUPER_ADMIN}`)}</option>
                                        </select>
                                    ) : (
                                        <select name="userRole" id="userRole" value={formData.userRole} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                            {ASSIGNABLE_ROLES.map(roleValue => (
                                                <option key={roleValue} value={roleValue}>{t(`roles.${roleValue}`)}</option>
                                            ))}
                                        </select>
                                    )}
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

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Rôles supplémentaires</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {secondaryRoles.map(role => (
                                        <label key={role} className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={formData.additionalRoles.includes(role)}
                                                onChange={() => handleAdditionalRoleToggle(role)}
                                                className="h-4 w-4 rounded border-slate-300 text-[#c6e911] focus:ring-[#c6e911]"
                                            />
                                            <span className="text-sm text-slate-700">{t(`roles.${role}`)}</span>
                                        </label>
                                    ))}
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