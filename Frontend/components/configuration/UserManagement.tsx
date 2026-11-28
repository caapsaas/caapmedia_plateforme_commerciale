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
import { ArrowRightLeft, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
    getUsersPaginated,
    registerUser,
    updateUser,
    deleteUser,
    transferUser,
    updateSubsidiaryAccess,
    UserRegisterData,
    UserUpdateData,
} from '../../services/apiCommon/apiUserAuth';
import { getSubsidiaries } from '../../services/apiCommon/apiSubsidiaries';
import SlideOverDrawer from '../common/SlideOverDrawer';
import { Badge, Button } from '../ui';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import CrmListSkeleton from '../ui/CrmListSkeleton';
import Pagination from '../common/Pagination';

const USERS_PAGE_SIZE = 10;

const UserManagement: React.FC = () => {
    const { t } = useI18n();
    const toast = useToast();
    const { subsidiary, user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.userRole === UserRole.SUPER_ADMIN || currentUser?.additionalRoles?.includes(UserRole.SUPER_ADMIN) === true;
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [transferTargetUser, setTransferTargetUser] = useState<User | null>(null);
    const [transferToSubsidiaryId, setTransferToSubsidiaryId] = useState('');
    const [transferReason, setTransferReason] = useState('');
    const [accessTargetUser, setAccessTargetUser] = useState<User | null>(null);
    const [selectedAccessIds, setSelectedAccessIds] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    // --- Data Fetching ---
    const { data: paginatedUsers, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['users', 'paginated', isSuperAdmin ? 'global' : subsidiary?.id, page, search],
        queryFn: () => getUsersPaginated({ page, limit: USERS_PAGE_SIZE, search: search || undefined }),
        enabled: isSuperAdmin || !!subsidiary,
    });
    const users = paginatedUsers?.data ?? [];
    const usersMeta = paginatedUsers?.meta;
    const { data: allSubsidiaries = [], isLoading: isLoadingSubs } = useQuery<Subsidiary[]>({
        queryKey: ['subsidiaries'],
        queryFn: getSubsidiaries,
    });

    // --- Mutations ---
    const { mutate: createUser } = useMutation({
        mutationFn: (data: UserRegisterData) => registerUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
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
            queryClient.invalidateQueries({ queryKey: ['users'] });
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
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Utilisateur supprimé!', 'L\'utilisateur a été supprimé avec succès.');
            handleCloseModals();
        },
        onError: () => {
            toast.error('Erreur de suppression', 'Une erreur est survenue lors de la suppression de l\'utilisateur.');
        }
    });

    const transferMutation = useMutation({
        mutationFn: ({ userId, toSubsidiaryId, reason }: { userId: string; toSubsidiaryId: string; reason?: string }) =>
            transferUser(userId, { toSubsidiaryId, reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(t('userGovernance.transferSuccess'), '');
            setTransferTargetUser(null);
            setTransferToSubsidiaryId('');
            setTransferReason('');
        },
        onError: () => {
            toast.error('Erreur', 'Impossible de muter cet utilisateur.');
        },
    });

    const accessMutation = useMutation({
        mutationFn: ({ userId, subsidiaryIds }: { userId: string; subsidiaryIds: string[] }) =>
            updateSubsidiaryAccess(userId, subsidiaryIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(t('userGovernance.accessSuccess'), '');
            setAccessTargetUser(null);
        },
        onError: () => {
            toast.error('Erreur', 'Impossible de mettre à jour les accès multi-filiales.');
        },
    });

    const handleOpenTransferDrawer = (u: User) => {
        setTransferTargetUser(u);
        const firstOther = allSubsidiaries.find((s) => s.id !== u.subsidiaryId);
        setTransferToSubsidiaryId(firstOther?.id || '');
        setTransferReason('');
    };

    const handleOpenAccessDrawer = (u: User) => {
        setAccessTargetUser(u);
        setSelectedAccessIds(u.subsidiaryAccessIds ?? []);
    };

    const toggleAccessSubsidiary = (subId: string) => {
        setSelectedAccessIds((prev) =>
            prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId],
        );
    };

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

    if (!subsidiary && !isSuperAdmin) {
        return <CrmListSkeleton columns={5} />;
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
            <div className="mb-4">
                <input
                    type="search"
                    value={search}
                    onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                    placeholder={t('common.search')}
                    aria-label={t('common.search')}
                    className="w-full md:max-w-sm rounded-md border border-slate-300 px-4 py-2 text-sm focus:border-[#c6e911] focus:outline-none focus:ring-1 focus:ring-[#c6e911]"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('configuration.productId')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.email')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.role')}</th>
                            {isSuperAdmin && <th scope="col" className="px-6 py-3">Filiale</th>}
                            <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingUsers ? (
                            <TableSkeleton rows={USERS_PAGE_SIZE} columns={isSuperAdmin ? 6 : 5} />
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={isSuperAdmin ? 6 : 5}>
                                    <EmptyState icon="inbox" title={t('configuration.userManagement')} description={t('common.notAvailable')} />
                                </td>
                            </tr>
                        ) : users.map((user) => (
                            <tr key={user.id} className="bg-white border-b hover:bg-slate-50">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{user.id}</th>
                                <td className="px-6 py-4 font-semibold">{user.userName}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#c6e911] text-slate-800">
                                            {t(`roles.${user.userRole}`)}
                                        </span>
                                        {(user.additionalRoles ?? []).map(role => (
                                            <span key={role} className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-600">
                                                {t(`roles.${role}`)}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                {isSuperAdmin && (
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span>{user.subsidiary?.subsidiaryName || user.subsidiary?.name || '—'}</span>
                                            {(user.subsidiaryAccessIds?.length ?? 0) > 0 && (
                                                <Badge variant="info">+{user.subsidiaryAccessIds!.length}</Badge>
                                            )}
                                        </div>
                                    </td>
                                )}
                                <td className="px-6 py-4 text-center space-x-1 whitespace-nowrap">
                                    {isSuperAdmin && (
                                        <>
                                            <button
                                                onClick={() => handleOpenTransferDrawer(user)}
                                                className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-full transition-colors"
                                                title={t('userGovernance.transferAction')}
                                                aria-label={t('userGovernance.transferAction')}
                                            >
                                                <ArrowRightLeft className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleOpenAccessDrawer(user)}
                                                className="p-2 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors"
                                                title={t('userGovernance.accessAction')}
                                                aria-label={t('userGovernance.accessAction')}
                                            >
                                                <Building2 className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
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
            {usersMeta && <Pagination meta={usersMeta} onPageChange={setPage} />}

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

            <SlideOverDrawer
                isOpen={!!transferTargetUser}
                onClose={() => setTransferTargetUser(null)}
                title={t('userGovernance.transferTitle')}
                subtitle={transferTargetUser ? `${transferTargetUser.userName} (${transferTargetUser.subsidiary?.subsidiaryName || ''})` : undefined}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setTransferTargetUser(null)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            isLoading={transferMutation.isPending}
                            disabled={!transferToSubsidiaryId}
                            onClick={() =>
                                transferTargetUser &&
                                transferMutation.mutate({
                                    userId: transferTargetUser.id,
                                    toSubsidiaryId: transferToSubsidiaryId,
                                    reason: transferReason.trim() || undefined,
                                })
                            }
                        >
                            {t('userGovernance.transferSubmit')}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                            {t('userGovernance.transferTarget')}
                        </label>
                        <select
                            value={transferToSubsidiaryId}
                            onChange={(e) => setTransferToSubsidiaryId(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        >
                            {allSubsidiaries
                                .filter((s) => s.id !== transferTargetUser?.subsidiaryId)
                                .map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.subsidiaryName}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                            {t('userGovernance.transferReason')}
                        </label>
                        <textarea
                            rows={3}
                            value={transferReason}
                            onChange={(e) => setTransferReason(e.target.value)}
                            placeholder="Ex: Renfort opérationnel Q4 Douala"
                            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        />
                    </div>
                </div>
            </SlideOverDrawer>

            <SlideOverDrawer
                isOpen={!!accessTargetUser}
                onClose={() => setAccessTargetUser(null)}
                title={t('userGovernance.accessTitle')}
                subtitle={accessTargetUser?.userName}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setAccessTargetUser(null)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            isLoading={accessMutation.isPending}
                            onClick={() =>
                                accessTargetUser &&
                                accessMutation.mutate({
                                    userId: accessTargetUser.id,
                                    subsidiaryIds: selectedAccessIds,
                                })
                            }
                        >
                            {t('userGovernance.accessSubmit')}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-3">
                    <p className="text-xs text-[var(--muted-foreground)]">
                        {t('userGovernance.accessHint')}
                    </p>
                    <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-[var(--radius-md)]">
                        {allSubsidiaries.map((s) => {
                            const isHome = s.id === accessTargetUser?.subsidiaryId;
                            const isChecked = isHome || selectedAccessIds.includes(s.id);
                            return (
                                <label
                                    key={s.id}
                                    className="flex items-center justify-between px-3.5 py-2.5 text-sm cursor-pointer hover:bg-[var(--muted)]/50"
                                >
                                    <span className="flex items-center gap-2.5">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            disabled={isHome}
                                            onChange={() => toggleAccessSubsidiary(s.id)}
                                            className="rounded border-slate-300"
                                        />
                                        <span className="font-medium text-[var(--foreground)]">
                                            {s.subsidiaryName}
                                        </span>
                                    </span>
                                    {isHome && (
                                        <Badge variant="brand">{t('userGovernance.homeBadge')}</Badge>
                                    )}
                                </label>
                            );
                        })}
                    </div>
                </div>
            </SlideOverDrawer>
        </div>
    );
};

export default UserManagement;
