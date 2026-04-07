import React, { useState } from 'react';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import { Subsidiary, User, UserRole } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import UserFormModal from './UserFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers, registerUser, updateUser, deleteUser, UserRegisterData, UserUpdateData } from '../../services/apiCommon/apiUserAuth';
import { getSubsidiaries } from '../../services/apiCommon/apiSubsidiaries';


const UserManagement: React.FC = () => {
    const { t } = useI18n();
    const toast = useToast();
    const { subsidiary } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    // --- Data Fetching ---
    const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
        queryKey: ['users', subsidiary?.id],
        queryFn: getAllUsers,
        enabled: !!subsidiary,
    });
    const { data: allSubsidiaries = [], isLoading: isLoadingSubs } = useQuery<Subsidiary[]>({
        queryKey: ['subsidiaries'],
        queryFn: getSubsidiaries,
    });

    // --- Mutations ---
    const { mutate: createUser } = useMutation({
        mutationFn: (data: UserRegisterData) => registerUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', subsidiary?.id] });
            toast.success('Utilisateur créé!', 'L\'utilisateur a été créé avec succès.');
            handleCloseModals();
        },
        onError: () => {
            toast.error('Erreur de création', 'Une erreur est survenue lors de la création de l\'utilisateur.');
        }
    });
    const { mutate: editUser } = useMutation({
        mutationFn: ({ id, data }: { id: string, data: UserUpdateData }) => updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', subsidiary?.id] });
            toast.success('Utilisateur modifié!', 'L\'utilisateur a été modifié avec succès.');
            handleCloseModals();
        },
        onError: () => {
            toast.error('Erreur de modification', 'Une erreur est survenue lors de la modification de l\'utilisateur.');
        }
    });
    const { mutate: onDelete } = useMutation({ 
        mutationFn: deleteUser, 
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', subsidiary?.id] });
            toast.success('Utilisateur supprimé!', 'L\'utilisateur a été supprimé avec succès.');
            handleCloseModals();
        },
        onError: () => {
            toast.error('Erreur de suppression', 'Une erreur est survenue lors de la suppression de l\'utilisateur.');
        }
    });

    // Le filtrage se fait maintenant sur les données récupérées localement
    const subsidiaryUsers = users.filter(u => u.subsidiaryId === subsidiary?.id);
    
    const handleOpenAddModal = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (user: User) => {
        setDeletingUser(user);
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setDeletingUser(null);
        setEditingUser(null);
    };

    const handleSaveUser = (userData: Omit<User, 'id'> & { id?: string }) => {
        const { id, ...data } = userData;
        
        // Validation pour s'assurer que subsidiaryId est présent pour les nouveaux utilisateurs uniquement
        if (!id && (!data.subsidiaryId || data.subsidiaryId.trim() === '')) {
            toast.error('Erreur de validation', 'Une filiale doit être sélectionnée pour créer un utilisateur.');
            return;
        }
        
        if (id) {
            editUser({ id, data });
        } else {
            createUser(data as UserRegisterData);
        }
    };

    const handleDeleteUser = () => {
        if (deletingUser) {
            onDelete(deletingUser.id);
        }
    };

    if (!subsidiary || isLoadingUsers || isLoadingSubs) {
        return <div className="p-6 text-center">{t('common.loading')}</div>;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('configuration.userManagement')}</h3>
                <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                    <IconPlus className="h-4 w-4" />
                    <span>{t('configuration.addUser')}</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('configuration.productId')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.email')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.role')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subsidiaryUsers.map((user) => (
                            <tr key={user.id} className="bg-white border-b hover:bg-slate-50">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{user.id}</th>
                                <td className="px-6 py-4 font-semibold">{user.userName}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-800">
                                        {t(`roles.${user.userRole}`)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center space-x-2">
                                    <button onClick={() => handleOpenEditModal(user)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                        <IconEdit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenDeleteModal(user)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
                                        <IconDelete className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <UserFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSaveUser}
                    user={editingUser}
                    subsidiaries={allSubsidiaries}
                    currentSubsidiaryId={subsidiary?.id || (allSubsidiaries.length > 0 ? allSubsidiaries[0].id : '')}
                />
            )}
            {deletingUser && (
                 <ConfirmationModal
                    isOpen={!!deletingUser}
                    onClose={handleCloseModals}
                    onConfirm={handleDeleteUser}
                    title={t('configuration.modal.deleteUserTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', {itemName: deletingUser.userName})}
                />
            )}
        </div>
    );
};

export default UserManagement;