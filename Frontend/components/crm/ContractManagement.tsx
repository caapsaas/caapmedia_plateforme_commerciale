import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Contract, ContractStatus, Contact } from '../../types';
import { useI18n } from '../../i18n';
import { getContractsPaginated } from '../../services/apiCrm/apiCrm';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import ContractFormModal from './ContractFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import Pagination from '../common/Pagination';

const CONTRACTS_PAGE_SIZE = 10;

interface ContractManagementProps {
    subsidiaryId: string;
    filterSubsidiaryId?: string;
    contacts: Contact[];
    onSave: (data: Omit<Contract, 'id' | 'subsidiaryId'> & { id?: string }) => void;
    onDelete: (id: string) => void;
}

const ContractManagement: React.FC<ContractManagementProps> = ({
    subsidiaryId,
    filterSubsidiaryId,
    contacts,
    onSave,
    onDelete,
}) => {
    const { t, formatCurrency } = useI18n();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    const [deletingContract, setDeletingContract] = useState<Contract | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [filterSubsidiaryId]);

    const { data: paginatedContracts, isLoading } = useQuery({
        queryKey: ['contracts', subsidiaryId, 'paginated', page, filterSubsidiaryId],
        queryFn: () =>
            getContractsPaginated({
                page,
                limit: CONTRACTS_PAGE_SIZE,
                subsidiaryId: filterSubsidiaryId,
            }),
    });

    const contracts = paginatedContracts?.data || [];
    const meta = paginatedContracts?.meta;

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Non définie';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleOpenAddModal = () => {
        setEditingContract(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (contract: Contract) => {
        setEditingContract(contract);
        setIsFormModalOpen(true);
    };

    const handleOpenDeleteModal = (contract: Contract) => {
        setDeletingContract(contract);
    };

    const handleCloseModals = () => {
        setIsFormModalOpen(false);
        setDeletingContract(null);
    };

    const handleSave = (data: Omit<Contract, 'id' | 'subsidiaryId'>) => {
        onSave({ id: editingContract?.id, ...data });
        handleCloseModals();
    };

    const handleDelete = () => {
        if (deletingContract) {
            onDelete(deletingContract.id);
            handleCloseModals();
        }
    };

    const getStatusClass = (status: ContractStatus) => {
        switch (status) {
            case ContractStatus.DRAFT: return 'bg-gray-100 text-gray-800';
            case ContractStatus.ACTIVE: return 'bg-green-100 text-green-800';
            case ContractStatus.EXPIRED: return 'bg-yellow-100 text-yellow-800';
            case ContractStatus.CANCELLED: return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getClientName = (clientId: string) => {
        return contacts.find(c => c.id === clientId)?.contactName || clientId;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('crm.contracts.title')}</h3>
                <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                    <IconPlus className="h-4 w-4" />
                    <span>{t('crm.contracts.add')}</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('crm.contracts.table.title')}</th>
                            <th scope="col" className="px-6 py-3">{t('crm.contracts.table.client')}</th>
                            <th scope="col" className="px-6 py-3">{t('crm.contracts.table.startDate')}</th>
                            <th scope="col" className="px-6 py-3">{t('crm.contracts.table.endDate')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('crm.contracts.table.amount')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('crm.contracts.table.status')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <TableSkeleton rows={CONTRACTS_PAGE_SIZE} columns={7} />
                        ) : contracts.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <EmptyState icon="document" title={t('crm.contracts.title')} description={t('common.notAvailable')} />
                                </td>
                            </tr>
                        ) : contracts.map((contract) => (
                            <tr key={contract.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{contract.title}</td>
                                <td className="px-6 py-4">{getClientName(contract.clientId)}</td>
                                <td className="px-6 py-4">{formatDate(contract.startDate)}</td>
                                <td className="px-6 py-4">{formatDate(contract.endDate)}</td>
                                <td className="px-6 py-4 text-right font-medium">{formatCurrency(contract.amount)}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(contract.status)}`}>
                                        {t(`crm.contracts.status_${contract.status}`)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center space-x-1">
                                    <button onClick={() => handleOpenEditModal(contract)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                        <IconEdit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenDeleteModal(contract)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
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
                <ContractFormModal
                    isOpen={isFormModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSave}
                    contract={editingContract}
                    contacts={contacts}
                />
            )}
             {deletingContract && (
                <ConfirmationModal
                    isOpen={!!deletingContract}
                    onClose={handleCloseModals}
                    onConfirm={handleDelete}
                    title={t('crm.contracts.modal.deleteTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: deletingContract.title })}
                />
            )}
        </div>
    );
};

export default ContractManagement;
