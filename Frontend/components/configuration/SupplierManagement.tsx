import React, { useState } from 'react';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import { Supplier } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import SupplierFormModal from './SupplierFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../services/apiPurchasing/apiSupplier';

const SupplierManagement: React.FC = () => {
    const { t } = useI18n();
    const toast = useToast();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

    const { data: suppliers = [], isLoading, isError } = useQuery<Supplier[]>({
        queryKey: ['suppliers'],
        queryFn: getSuppliers,
    });

    const { mutate: saveSupplierMutate } = useMutation({
        mutationFn: (supplierData: Omit<Supplier, 'id' | 'subsidiaryId'> & { id?: string }) =>
            supplierData.id ? updateSupplier(supplierData.id, supplierData) : createSupplier(supplierData),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            const action = variables.id ? 'modifié' : 'ajouté';
            toast.success('Fournisseur sauvegardé!', `Le fournisseur a été ${action} avec succès.`);
            handleCloseModals();
        },
        onError: () => {
            toast.error('Erreur de sauvegarde', 'Une erreur est survenue lors de la sauvegarde du fournisseur.');
        }
    });

    const { mutate: deleteSupplierMutate } = useMutation({
        mutationFn: deleteSupplier,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success('Fournisseur supprimé!', 'Le fournisseur a été supprimé avec succès.');
            handleCloseModals();
        },
        onError: () => {
            toast.error('Erreur de suppression', 'Une erreur est survenue lors de la suppression du fournisseur.');
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
        if (deletingSupplier) {
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
                        {suppliers.map((supplier) => (
                            <tr key={supplier.id} className="bg-white border-b hover:bg-slate-50">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{supplier.id}</th>
                                <td className="px-6 py-4 font-semibold">{supplier.supplierName}</td>
                                <td className="px-6 py-4">{supplier.company}</td>
                                <td className="px-6 py-4">{supplier.email}</td>
                                <td className="px-6 py-4">{supplier.phone}</td>
                                <td className="px-6 py-4 text-center space-x-2">
                                    <button onClick={() => handleOpenEditModal(supplier)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                        <IconEdit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenDeleteModal(supplier)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
                                        <IconDelete className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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
                    onClose={handleCloseModals}
                    onConfirm={handleDeleteSupplier}
                    title={t('configuration.modal.deleteSupplierTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', {itemName: deletingSupplier.supplierName})}
                />
            )}
        </div>
    );
};

export default SupplierManagement;