import React, { useEffect, useState } from 'react';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import { Supplier } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import SupplierFormModal from './SupplierFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { getSuppliersPaginated, createSupplier, updateSupplier, deleteSupplier, restoreSupplier } from '../../services/apiPurchasing/apiSupplier';
import { Badge } from '../ui';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import Pagination from '../common/Pagination';

const SUPPLIERS_PAGE_SIZE = 10;

const SupplierManagement: React.FC = () => {
    const { t } = useI18n();
    const toast = useToast();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        setPage(1);
    }, [search, showArchived]);

    const { data: paginatedSuppliers, isLoading } = useQuery({
        queryKey: ['suppliers', 'paginated', page, search, showArchived],
        queryFn: () => getSuppliersPaginated({ page, limit: SUPPLIERS_PAGE_SIZE, search: search || undefined, includeArchived: showArchived || undefined }),
    });

    const suppliers = paginatedSuppliers?.data || [];
    const meta = paginatedSuppliers?.meta;

    const { mutate: saveSupplierMutate } = useMutation({
        mutationFn: (supplierData: Omit<Supplier, 'id' | 'subsidiaryId'> & { id?: string }) =>
            supplierData.id ? updateSupplier(supplierData.id, supplierData) : createSupplier(supplierData),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
            const action = variables.id ? 'modifié' : 'ajouté';
            toast.success('Fournisseur sauvegardé!', `Le fournisseur a été ${action} avec succès.`);
            handleCloseModals();
        },
        onError: () => {
            toast.error('Erreur de sauvegarde', 'Une erreur est survenue lors de la sauvegarde du fournisseur.');
        }
    });

    const { mutate: deleteSupplierMutate, isPending: isDeletingSupplier } = useMutation({
        mutationFn: deleteSupplier,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
            toast.success(t('supplierGovernance.archiveSuccess'), '');
            handleCloseModals();
        },
        onError: () => {
            toast.error('Erreur', 'Impossible d’archiver ce fournisseur.');
        }
    });

    const { mutate: restoreSupplierMutate, isPending: isRestoringSupplier } = useMutation({
        mutationFn: restoreSupplier,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
            toast.success(t('supplierGovernance.restoreSuccess'), '');
        },
        onError: () => {
            toast.error('Erreur', 'Impossible de restaurer ce fournisseur.');
        }
    });

    const handleOpenAddModal = () => {
        setEditingSupplier(null);
        setIsModalOpen(true);
    };
    const handleOpenEditModal = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };
    const handleOpenDeleteModal = (supplier: Supplier) => {
        setDeletingSupplier(supplier);
    };
    const handleCloseModals = () => {
        setIsModalOpen(false);
        setDeletingSupplier(null);
        setEditingSupplier(null);
    };
    const handleSaveSupplier = (supplierData: Omit<Supplier, 'id' | 'subsidiaryId'> & { id?: string }) => {
        saveSupplierMutate(supplierData);
    };
    const handleDeleteSupplier = () => {
        if (deletingSupplier && !isDeletingSupplier) {
            deleteSupplierMutate(deletingSupplier.id);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('configuration.supplierManagement')}</h3>
                <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                    <IconPlus className="h-4 w-4" />
                    <span>{t('configuration.addSupplier')}</span>
                </button>
            </div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('common.search')}
                    className="w-full sm:w-72 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                />
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                        className="rounded border-slate-300"
                    />
                    <span>{t('supplierGovernance.showArchived')}</span>
                </label>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('configuration.productId')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.company')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.email')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.phone')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <TableSkeleton rows={SUPPLIERS_PAGE_SIZE} columns={6} />
                        ) : suppliers.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <EmptyState icon="truck" title={t('configuration.supplierManagement')} description={t('common.notAvailable')} />
                                </td>
                            </tr>
                        ) : suppliers.map((supplier) => {
                            const isArchived = supplier.isActive === false;
                            return (
                            <tr key={supplier.id} className={`border-b hover:bg-slate-50 ${isArchived ? 'bg-slate-50/70 opacity-75' : 'bg-white'}`}>
                                <th scope="row" className="px-6 py-4 font-mono text-xs font-medium text-slate-900 whitespace-nowrap">{supplier.id}</th>
                                <td className="px-6 py-4 font-semibold">
                                    <div className="flex items-center gap-2">
                                        <span>{supplier.supplierName}</span>
                                        {isArchived && <Badge variant="neutral">{t('supplierGovernance.archivedBadge')}</Badge>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">{supplier.company}</td>
                                <td className="px-6 py-4">{supplier.email}</td>
                                <td className="px-6 py-4">{supplier.phone}</td>
                                <td className="px-6 py-4 text-center space-x-2">
                                    <button onClick={() => handleOpenEditModal(supplier)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                        <IconEdit className="h-5 w-5" />
                                    </button>
                                    {isArchived ? (
                                        <button
                                            onClick={() => restoreSupplierMutate(supplier.id)}
                                            disabled={isRestoringSupplier}
                                            className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors"
                                            title={t('supplierGovernance.restoreAction')}
                                            aria-label={t('supplierGovernance.restoreAction')}
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleOpenDeleteModal(supplier)}
                                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                            title={t('supplierGovernance.archiveAction')}
                                            aria-label={t('supplierGovernance.archiveAction')}
                                        >
                                            <IconDelete className="h-5 w-5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {meta && <Pagination meta={meta} onPageChange={setPage} />}

            {isModalOpen && (
                <SupplierFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSaveSupplier}
                    supplier={editingSupplier}
                />
            )}
            {deletingSupplier && (
                 <ConfirmationModal
                    isOpen={!!deletingSupplier}
                    onClose={() => { if (!isDeletingSupplier) handleCloseModals(); }}
                    onConfirm={handleDeleteSupplier}
                    title={t('supplierGovernance.archiveAction')}
                    message={t('supplierGovernance.archiveConfirm')}
                    isDangerous
                    isLoading={isDeletingSupplier}
                />
            )}
        </div>
    );
};

export default SupplierManagement;
