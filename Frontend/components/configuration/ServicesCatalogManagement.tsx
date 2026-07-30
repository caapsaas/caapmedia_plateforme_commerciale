import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product } from '../../types/models';
import { ProductFormData } from '../../types/forms';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { categoryToKeyMap } from '../../constants';
import { getImageUrl } from '../../utils/imageUtils';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import IconSettings from '../icons/IconSettings';
import IconArrowLeft from '../icons/IconArrowLeft';
import IconImage from '../icons/IconImage';
import ServiceFormModal from './ServiceFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import ProductSpecBuilder from './ProductSpecBuilder/ProductSpecBuilder';
import { getProductsPaginated, createProduct, updateProduct, deleteProduct } from '../../services/apiE-commerce/apiProducts';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import Pagination from '../common/Pagination';

const SERVICES_PAGE_SIZE = 10;

// Catalogue de services (Chantier 1 : donnée globale, non scopée filiale) +
// point d'entrée vers le Builder de spécifications techniques (Chantier 5).
const ServicesCatalogManagement: React.FC = () => {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const toast = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Product | null>(null);
    const [deletingItem, setDeletingItem] = useState<Product | null>(null);
    const [builderTarget, setBuilderTarget] = useState<Product | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const { data: paginatedServices, isLoading, isError } = useQuery({
        queryKey: ['servicesCatalog', 'paginated', page, search],
        queryFn: () => getProductsPaginated({ page, limit: SERVICES_PAGE_SIZE, search: search || undefined }),
    });

    const services = paginatedServices?.data || [];
    const meta = paginatedServices?.meta;

    useEffect(() => {
        setPage(1);
    }, [search]);

    const { mutate: saveMutate } = useMutation({
        mutationFn: ({ id, data }: { id?: string; data: ProductFormData }) =>
            id ? updateProduct(id, data) : createProduct(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['servicesCatalog'] });
            toast.success('Service sauvegardé !', `Le service a été ${variables.id ? 'modifié' : 'ajouté'} avec succès.`);
            handleCloseModals();
        },
        onError: () => toast.error('Erreur de sauvegarde', 'Une erreur est survenue lors de la sauvegarde du service.'),
    });

    const { mutate: deleteMutate } = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['servicesCatalog'] });
            toast.success('Service supprimé !', 'Le service a été supprimé avec succès.');
            handleCloseModals();
        },
        onError: () => toast.error('Erreur de suppression', 'Une erreur est survenue lors de la suppression du service.'),
    });

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setDeletingItem(null);
    };

    const handleSave = (itemData: ProductFormData & { id?: string }) => {
        saveMutate({ id: itemData.id, data: itemData });
    };

    if (builderTarget) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md">
                <button
                    onClick={() => setBuilderTarget(null)}
                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4"
                >
                    <IconArrowLeft className="h-4 w-4" /> {t('configuration.builder.back')}
                </button>
                <ProductSpecBuilder productId={builderTarget.id} productName={builderTarget.name} />
            </div>
        );
    }

    if (isError) return <div>Erreur lors du chargement des services.</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('configuration.services')}</h3>
                <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                    <IconPlus className="h-4 w-4" />
                    <span>{t('configuration.addService')}</span>
                </button>
            </div>
            <div className="mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('common.search')}
                    className="w-full sm:w-72 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#c6e911]"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('configuration.serviceForm.images')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.serviceForm.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.serviceForm.category')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('configuration.serviceForm.isActive')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <TableSkeleton rows={SERVICES_PAGE_SIZE} columns={5} />
                        ) : services.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <EmptyState icon="document" title={t('configuration.services')} description={t('common.notAvailable')} />
                                </td>
                            </tr>
                        ) : services.map(item => (
                            <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className={`h-10 w-10 flex items-center justify-center rounded-lg border overflow-hidden ${item.productImages?.[0] ? 'border-slate-200 bg-slate-100' : 'border-dashed border-slate-300 text-slate-300'}`}>
                                        {item.productImages?.[0] ? (
                                            <LazyLoadImage
                                                src={getImageUrl(item.productImages[0].imageUrl)}
                                                alt={item.name}
                                                effect="blur"
                                                width="100%"
                                                height="100%"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <IconImage className="h-5 w-5" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-semibold">{item.name}</td>
                                <td className="px-6 py-4">{t(categoryToKeyMap[item.category] || item.category)}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {item.isActive ? t('configuration.serviceForm.isActive') : '-'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center space-x-1">
                                        <button onClick={() => setBuilderTarget(item)} className="p-2 text-slate-500 hover:text-[#8a9e0c] hover:bg-[#c6e911]/20 rounded-full transition-colors" title={t('configuration.builder.configureFields')}>
                                            <IconSettings className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                            <IconEdit className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => setDeletingItem(item)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
                                            <IconDelete className="h-5 w-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {meta && <Pagination meta={meta} onPageChange={setPage} />}

            {isModalOpen && (
                <ServiceFormModal
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
                    onConfirm={() => deleteMutate(deletingItem.id)}
                    title={t('configuration.modal.deleteServiceTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: deletingItem.name })}
                />
            )}
        </div>
    );
};

export default ServicesCatalogManagement;
