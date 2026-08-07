import React, { useState } from 'react';
import { Bank } from '../../types';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import ConfirmationModal from '../common/ConfirmationModal';
import BankFormModal from './BankFormModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBanks, createBank, updateBank, deleteBank } from '../../services/apiFinance/apiBanks';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import { useToast } from '../../context/ToastContext';

// Gestion des banques (institutions physiques) référencées par les comptes
// de trésorerie de type Banque — voir TreasuryAccountFormModal. Sans portée
// filiale : une banque est un tiers global, comme sur gmo.
const BankManagement: React.FC = () => {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBank, setEditingBank] = useState<Bank | null>(null);
    const [deletingBank, setDeletingBank] = useState<Bank | null>(null);

    const { data: banks = [], isLoading, isError } = useQuery<Bank[]>({
        queryKey: ['banks'],
        queryFn: getBanks,
    });

    const onMutationError = (error: any) => {
        toast('error', error?.response?.data?.message || t('common.error'));
    };

    const { mutate: saveBankMutate } = useMutation({
        mutationFn: (bankData: Omit<Bank, 'id'> & { id?: string }) =>
            bankData.id ? updateBank(bankData.id, bankData) : createBank(bankData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banks'] });
            handleCloseModals();
        },
        onError: onMutationError,
    });

    const { mutate: deleteBankMutate } = useMutation({
        mutationFn: deleteBank,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banks'] });
            handleCloseModals();
        },
        onError: onMutationError,
    });

    const handleOpenAddModal = () => {
        setEditingBank(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (bank: Bank) => {
        setEditingBank(bank);
        setIsModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setEditingBank(null);
        setDeletingBank(null);
    };

    const handleDelete = () => {
        if (deletingBank) {
            deleteBankMutate(deletingBank.id);
        }
    };

    if (isError) {
        return <div>{t('common.error.load', { item: 'banks' })}</div>;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-slate-800">{t('configuration.bank.management')}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{t('configuration.bank.managementDescription')}</p>
                </div>
                <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                    <IconPlus className="h-4 w-4" />
                    <span>{t('configuration.bank.add')}</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('configuration.bank.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.form.address')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.form.phone')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.bank.type')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <TableSkeleton rows={4} columns={5} />
                        ) : banks.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <EmptyState icon="inbox" title={t('configuration.bank.management')} description={t('common.notAvailable')} />
                                </td>
                            </tr>
                        ) : banks.map((bank) => (
                            <tr key={bank.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold text-slate-900">{bank.name}</td>
                                <td className="px-6 py-4">{bank.address}</td>
                                <td className="px-6 py-4">{bank.phone}</td>
                                <td className="px-6 py-4">{t(`configuration.bank.types.${bank.type}`)}</td>
                                <td className="px-6 py-4 text-center space-x-2">
                                    <button onClick={() => handleOpenEditModal(bank)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title={t('common.edit')}>
                                        <IconEdit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => setDeletingBank(bank)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" title={t('common.delete')}>
                                        <IconDelete className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <BankFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModals}
                    onSave={saveBankMutate}
                    bank={editingBank}
                />
            )}
            {deletingBank && (
                <ConfirmationModal
                    isOpen={!!deletingBank}
                    onClose={handleCloseModals}
                    onConfirm={handleDelete}
                    title={t('configuration.bank.deleteTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: deletingBank.name })}
                />
            )}
        </div>
    );
};

export default BankManagement;
