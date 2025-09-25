
import React, { useState } from 'react';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import { Subsidiary, User, UserRole } from '../../types';
import { useI18n } from '../../i18n';
import UserFormModal from './UserFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { MOCK_SUBSIDIARIES } from '../../constants';

interface UserManagementProps {
    subsidiary: Subsidiary;
    users: User[];
    onSave: (userData: Omit<User, 'id'> & { id?: string }) => void;
    onDelete: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ subsidiary, users, onSave, onDelete }) => {
    const { t } = useI18n();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const subsidiaryUsers = users.filter(u => u.subsidiaryId === subsidiary.id);

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
        onSave(userData);
        handleCloseModals();
    };

    const handleDeleteUser = () => {
        if (deletingUser) {
            onDelete(deletingUser.id);
            handleCloseModals();
        }
    };

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
                                <td className="px-6 py-4 font-semibold">{user.name}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-800">
                                        {t(`roles.${user.role}`)}
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
                    subsidiaries={MOCK_SUBSIDIARIES}
                    currentSubsidiaryId={subsidiary.id}
                />
            )}
            {deletingUser && (
                 <ConfirmationModal
                    isOpen={!!deletingUser}
                    onClose={handleCloseModals}
                    onConfirm={handleDeleteUser}
                    title={t('configuration.modal.deleteUserTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', {itemName: deletingUser.name})}
                />
            )}
        </div>
    );
};

export default UserManagement;