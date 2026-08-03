import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Account } from '../../types';
import { useI18n } from '../../i18n';
import { getAccountsPaginated } from '../../services/apiCrm/apiCrm';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import AccountFormModal from './AccountFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import Pagination from '../common/Pagination';

const ACCOUNTS_PAGE_SIZE = 10;

interface AccountManagementProps {
    subsidiaryId: string;
    filterSubsidiaryId?: string;
    filterSalesRepId?: string;
    onSave: (data: Omit<Account, 'id' | 'subsidiaryId'> & { id?: string }) => void;
    onDelete: (id: string) => void;
}

const AccountManagement: React.FC<AccountManagementProps> = ({
    subsidiaryId,
    filterSubsidiaryId,
    filterSalesRepId,
    onSave,
    onDelete,
}) => {
    const { t } = useI18n();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [filterSubsidiaryId, filterSalesRepId]);

    const { data: paginatedAccounts, isLoading } = useQuery({
        queryKey: ['accounts', subsidiaryId, 'paginated', page, filterSubsidiaryId, filterSalesRepId],
        queryFn: () =>
            getAccountsPaginated({
                page,
                limit: ACCOUNTS_PAGE_SIZE,
                subsidiaryId: filterSubsidiaryId,
                salesRepId: filterSalesRepId,
            }),
    });

    const accounts = paginatedAccounts?.data || [];
    const meta = paginatedAccounts?.meta;

    const handleOpenAddModal = () => {
        setEditingAccount(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (account: Account) => {
        setEditingAccount(account);
        setIsFormModalOpen(true);
    };

    const handleOpenDeleteModal = (account: Account) => {
        setDeletingAccount(account);
    };

    const handleCloseModals = () => {
        setIsFormModalOpen(false);
        setDeletingAccount(null);
    };

    const handleSave = (data: Omit<Account, 'id' | 'subsidiaryId'>) => {
        onSave({ id: editingAccount?.id, ...data });
        handleCloseModals();
    };

    const handleDelete = () => {
        if (deletingAccount) {
            onDelete(deletingAccount.id);
            handleCloseModals();
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('crm.accounts.title')}</h3>
                <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                    <IconPlus className="h-4 w-4" />
                    <span>{t('crm.accounts.add')}</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('crm.accounts.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('crm.accounts.industry')}</th>
                            <th scope="col" className="px-6 py-3">{t('crm.accounts.phone')}</th>
                            <th scope="col" className="px-6 py-3">{t('crm.accounts.address')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <TableSkeleton rows={ACCOUNTS_PAGE_SIZE} columns={5} />
                        ) : accounts.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <EmptyState icon="document" title={t('crm.accounts.title')} description={t('common.notAvailable')} />
                                </td>
                            </tr>
                        ) : accounts.map((account) => (
                            <tr key={account.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{account.accountName}</td>
                                <td className="px-6 py-4">{account.industry}</td>
                                <td className="px-6 py-4">{account.phone}</td>
                                <td className="px-6 py-4">{account.address}</td>
                                <td className="px-6 py-4 text-center space-x-1">
                                    <button onClick={() => handleOpenEditModal(account)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                        <IconEdit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenDeleteModal(account)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
                                        <IconDelete className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {meta && <Pagination meta={meta} onPageChange={setPage} />}

            {isFormModalOpen && (
                <AccountFormModal
                    isOpen={isFormModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSave}
                    account={editingAccount}
                />
            )}
             {deletingAccount && (
                <ConfirmationModal
                    isOpen={!!deletingAccount}
                    onClose={handleCloseModals}
                    onConfirm={handleDelete}
                    title={t('crm.accounts.modal.deleteTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: deletingAccount.accountName })}
                />
            )}
        </div>
    );
};

export default AccountManagement;
