import React, { useState } from 'react';
import { categoryToKeyMap, rangeToKeyMap } from '../../constants';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import IconSparkles from '../icons/IconSparkles';
import { Product } from '../../types/models';
import { ProductFormData } from '../../types/forms';
import { useI18n } from '../../i18n';
import ProductFormModal from './ProductFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { useAppContext } from '../../context/AppContext';
import IconUpload from '../icons/IconUpload';
import ProductImportModal from './ProductImportModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductsBySubsidiary, createProduct, updateProduct, deleteProduct, generateProductImage } from '../../services/apiE-commerce/apiProducts'; 
import { getImageUrl } from '../../utils/imageUtils';

const ProductManagement: React.FC = () => {
    const { t, formatCurrency } = useI18n();
    const { state } = useAppContext();
    const { currentSubsidiary: subsidiary } = state;
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

    // --- TanStack Query: Data Fetching ---
    const { data: products = [], isLoading, isError } = useQuery<Product[]>({
        queryKey: ['products', subsidiary?.id],
        queryFn: getProductsBySubsidiary,
        enabled: !!subsidiary,
    });

    // --- TanStack Query: Mutations ---
    const { mutate: saveProductMutate } = useMutation({
        mutationFn: ({ id, data }: { id?: string, data: ProductFormData }) => id ? updateProduct(id, data) : createProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products', subsidiary?.id] });
            handleCloseModals();
        },
    });

    const { mutate: deleteProductMutate } = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products', subsidiary?.id] });
            handleCloseModals();
        },
    });

    const { mutate: generateImageMutate, isPending: isGeneratingImage, variables: generatingImageId } = useMutation({
        mutationFn: generateProductImage,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products', subsidiary?.id] }),
    });

    const handleOpenAddModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };
    
    const handleOpenDeleteModal = (product: Product) => {
        setDeletingProduct(product);
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setDeletingProduct(null);
        setEditingProduct(null);
    };

    const handleSave = (productData: ProductFormData & { id?: string }) => {
        saveProductMutate({ id: productData.id, data: productData });
    };

    const handleDeleteConfirm = () => {
        if(deletingProduct) {
            deleteProductMutate(deletingProduct.id);
        }
    };
    
    if (isLoading) {
        return <div>{t('common.loading')}</div>;
    }

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
                            <th scope="col" className="px-6 py-3">Image</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('stock.range')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.category')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.sellingPrice')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.stock')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <img 
                                        src={product.productImages && product.productImages.length > 0 ? getImageUrl(product.productImages[0].imageUrl) : 'https://via.placeholder.com/100'} 
                                        alt={product.name} 
                                        className="h-12 w-12 object-cover rounded-md"/>
                                </td>
                                <td className="px-6 py-4 font-semibold">{product.name}</td>
                                <td className="px-6 py-4">{product.range ? t(rangeToKeyMap[product.range] || product.range) : ''}</td>
                                <td className="px-6 py-4">{t(categoryToKeyMap[product.category] || product.category)}</td>
                                <td className="px-6 py-4">{formatCurrency(product.sellingPrice)}</td>
                                <td className={`px-6 py-4 font-bold ${product.stock < 100 ? 'text-red-500' : 'text-green-600'}`}>
                                    {product.stock}
                                </td>
                                <td className="px-6 py-4 text-center">
                                     <div className="flex flex-col items-center justify-center">
                                        <div className="flex items-center justify-center space-x-1">
                                            <button
                                                onClick={() => generateImageMutate(product.id)}
                                                className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-100 rounded-full transition-colors disabled:opacity-50"
                                                aria-label={t('configuration.form.generateWithAI')}
                                                disabled={isGeneratingImage}
                                            >
                                                {generatingImageId === product.id ? (
                                                     <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                ) : (
                                                    <IconSparkles className="h-5 w-5" />
                                                )}
                                            </button>
                                            <button onClick={() => handleOpenEditModal(product)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                                <IconEdit className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleOpenDeleteModal(product)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
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
                <ProductFormModal 
                    isOpen={isModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSave}
                    product={editingProduct}
                />
            )}
            {deletingProduct && (
                 <ConfirmationModal
                    isOpen={!!deletingProduct}
                    onClose={handleCloseModals}
                    onConfirm={handleDeleteConfirm}
                    title={t('configuration.modal.deleteProductTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', {itemName: deletingProduct.name})}
                />
            )}
        </div>
    );
};

export default ProductManagement;