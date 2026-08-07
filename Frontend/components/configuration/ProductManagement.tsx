import React, { useState } from 'react';
import { categoryToKeyMap, rangeToKeyMap } from '../../constants';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import IconUpload from '../icons/IconUpload';
import { StockItem } from '../../types/models';
import { StockItemFormData } from '../../types/forms';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import StockItemFormModal from './StockItemFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import ProductImportModal from './ProductImportModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStockItemsBySubsidiary, createStockItem, updateStockItem, deleteStockItem } from '../../services/apiPurchasing/apiStockItems';
import { useAuth } from '../../context/AuthContext';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';

const ProductManagement: React.FC = () => {
    const { t, formatCurrency } = useI18n();
    const { subsidiary } = useAuth();
    const queryClient = useQueryClient();
    const toast = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const [deletingItem, setDeletingItem] = useState<StockItem | null>(null);

    // --- TanStack Query: Data Fetching ---
    const { data: items = [], isLoading, isError } = useQuery<StockItem[]>({
        queryKey: ['stockItems', subsidiary?.id],
        queryFn: getStockItemsBySubsidiary,
        enabled: !!subsidiary,
    });

    // --- TanStack Query: Mutations ---
    const { mutate: saveItemMutate } = useMutation({
        mutationFn: ({ id, data }: { id?: string, data: StockItemFormData }) => id ? updateStockItem(id, data) : createStockItem(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['stockItems', subsidiary?.id] });
            const action = variables.id ? 'modifié' : 'ajouté';
            toast.success('Produit sauvegardé!', `Le produit a été ${action} avec succès.`);
            handleCloseModals();
        },
        onError: () => {
            toast.error('Erreur de sauvegarde', 'Une erreur est survenue lors de la sauvegarde du produit.');
        }
    });

    const { mutate: deleteItemMutate } = useMutation({
        mutationFn: deleteStockItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stockItems', subsidiary?.id] });
            toast.success('Produit supprimé!', 'Le produit a été supprimé avec succès.');
            handleCloseModals();
        },
        onError: () => {
            toast.error('Erreur de suppression', 'Une erreur est survenue lors de la suppression du produit.');
        }
    });

    const handleOpenAddModal = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item: StockItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (item: StockItem) => {
        setDeletingItem(item);
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setDeletingItem(null);
        setEditingItem(null);
    };

    const handleSave = (itemData: StockItemFormData & { id?: string }) => {
        saveItemMutate({ id: itemData.id, data: itemData });
    };

    const handleDeleteConfirm = () => {
        if (deletingItem) {
            deleteItemMutate(deletingItem.id);
        }
    };

    if (isError) {
        return <div>Erreur lors du chargement des produits.</div>;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('configuration.productManagement')}</h3>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setIsImportModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white text-sm font-semibold rounded-md hover:bg-slate-700 transition-colors">
                        <IconUpload className="h-4 w-4" />
                        <span>Importer</span>
                    </button>
                    <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                        <IconPlus className="h-4 w-4" />
                        <span>{t('configuration.addProduct')}</span>
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('configuration.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('stock.range')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.category')}</th>
                            <th scope="col" className="px-6 py-3">{t('stock.costPrice')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.stock')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <TableSkeleton rows={6} columns={6} />
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <EmptyState icon="stock" title={t('configuration.productManagement')} description={t('common.notAvailable')} />
                                </td>
                            </tr>
                        ) : items.map((item) => (
                            <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{item.name}</td>
                                <td className="px-6 py-4">{item.productRange ? t(rangeToKeyMap[item.productRange] || item.productRange) : 'Non specifie'}</td>
                                <td className="px-6 py-4">{t(categoryToKeyMap[item.category] || item.category)}</td>
                                <td className="px-6 py-4">{item.costPrice != null ? formatCurrency(item.costPrice) : '—'}</td>
                                <td className={`px-6 py-4 font-bold ${item.stock < 100 ? 'text-red-500' : 'text-green-600'}`}>
                                    {item.stock}
                                </td>
                                <td className="px-6 py-4 text-center">
                                     <div className="flex flex-col items-center justify-center">
                                        <div className="flex items-center justify-center space-x-1">
                                            <button onClick={() => handleOpenEditModal(item)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                                <IconEdit className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleOpenDeleteModal(item)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
                                                <IconDelete className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isImportModalOpen && (
                <ProductImportModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                />
            )}

            {isModalOpen && (
                <StockItemFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSave}
                    item={editingItem}
                />
            )}
            {deletingItem && (
                 <ConfirmationModal
                    isOpen={!!deletingItem}
                    onClose={handleCloseModals}
                    onConfirm={handleDeleteConfirm}
                    title={t('configuration.modal.deleteProductTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', {itemName: deletingItem.name})}
                />
            )}
        </div>
    );
};

export default ProductManagement;
