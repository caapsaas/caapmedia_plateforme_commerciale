import React, { useState, useMemo } from 'react';
import { categoryToKeyMap, rangeToKeyMap } from '../constants';
import { Subsidiary, Product } from '../types/models';
import { ProductFormData } from '../types/forms';
import { useI18n } from '../i18n';
import { exportToCsv } from '../utils/csvExporter';
import { exportToPdf } from '../utils/pdfExporter';
import IconPrint from '../components/icons/IconPrint';
import IconExport from '../components/icons/IconExport';
import IconPdf from '../components/icons/IconPdf';
import IconPlus from '../components/icons/IconPlus';
import IconEdit from '../components/icons/IconEdit';
import IconDelete from '../components/icons/IconDelete';
import { useAppContext } from '../context/AppContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductsBySubsidiary, createProduct, deleteProduct, updateProductSellingAndPrice } from '../services/apiE-commerce/apiProducts';
import ConfirmationModal from '../components/common/ConfirmationModal';
import ProductFormModal from '../components/configuration/ProductFormModal';
import IconSaveCheck from '../components/icons/IconSaveCheck';
import IconCancelX from '../components/icons/IconCancelX';
import IconSearch from '../components/icons/IconSearch';

const Stock: React.FC = () => {
    const { t, formatCurrency, formatNumber } = useI18n();
    const { state } = useAppContext();
    const queryClient = useQueryClient();
    const { currentSubsidiary: subsidiary } = state;
    
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [editedPrices, setEditedPrices] = useState<{ cost: number; selling: number }>({ cost: 0, selling: 0 });
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- TanStack Query: Data Fetching ---
    const { data: products = [], isLoading: isLoadingProducts, isError } = useQuery<Product[]>({
        queryKey: ['products', subsidiary?.id],
        queryFn: () => getProductsBySubsidiary(),
        enabled: !!subsidiary, // La requête ne s'exécute que si une filiale est définie
    });

    // --- TanStack Query: Mutations ---
    const { mutate: updatePriceMutate } = useMutation({
        mutationFn: ({ id, data }: { id: string, data: { price: number, sellingPrice: number } }) => updateProductSellingAndPrice(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products', subsidiary?.id] });
        },
    });

    const { mutate: createProductMutate } = useMutation({
        mutationFn: (productData: ProductFormData) => createProduct(productData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products', subsidiary?.id] });
            setIsAddModalOpen(false);
        },
    });

    const { mutate: deleteProductMutate } = useMutation({
        mutationFn: (id: string) => deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products', subsidiary?.id] });
            setProductToDelete(null);
        },
    });

    if (!subsidiary) {
        return <div>{t('common.loading')}</div>;
    }

    const filteredProducts = useMemo(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        if (!lowercasedTerm) {
            return products;
        }
        return products.filter(product =>
            product.productName.toLowerCase().includes(lowercasedTerm) ||
            product.id.toLowerCase().includes(lowercasedTerm) ||
            (product.description && product.description.toLowerCase().includes(lowercasedTerm))
        );
    }, [products, searchTerm]);

    const handleEdit = (product: Product) => {
        setEditingProductId(product.id);
        setEditedPrices({ cost: product.price, selling: product.sellingPrice });
    };

    const handleCancel = () => {
        setEditingProductId(null);
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'cost' | 'selling') => {
        const value = parseFloat(e.target.value);
        setEditedPrices(prev => ({ ...prev, [field]: isNaN(value) ? 0 : value }));
    };

    const handleSave = () => {
        if (editingProductId) {
            setShowSaveConfirm(true);
        }
    };

    const confirmSave = () => {
        if (!editingProductId) return;
        
        updatePriceMutate({
            id: editingProductId,
            data: {
            price: editedPrices.cost,
            sellingPrice: editedPrices.selling,
            }
        });
        setShowSaveConfirm(false);
        setEditingProductId(null);
    };

    const handleDelete = (product: Product) => {
        setProductToDelete(product);
    };

    const confirmDelete = () => {
        if (productToDelete) {
            deleteProductMutate(productToDelete.id);
        }
    };
    
    const handleSaveNewProduct = (productData: ProductFormData & { id?: string }) => {
        createProductMutate(productData);
    };

    const handlePrint = () => window.print();

    const handleExport = () => {
        const headers = [
            { key: 'id', label: t('stock.productId')},
            { key: 'name', label: t('stock.name')},
            { key: 'range', label: t('stock.range')},
            { key: 'category', label: t('stock.category')},
            { key: 'description', label: t('stock.description')},
            { key: 'warehouse', label: t('stock.warehouse')},
            { key: 'stock', label: t('stock.currentStock')},
            { key: 'price', label: t('stock.costPrice')},
            { key: 'sellingPrice', label: t('stock.sellingPrice')},
        ];
        const data = filteredProducts.map(p => ({
            ...p,
            category: t(categoryToKeyMap[p.category] || p.category),
            range: p.range ? t(rangeToKeyMap[p.range] || p.range) : '',
        }));
        exportToCsv('etat_stock', headers, data);
    };
    
    const handleExportPdf = () => {
        const headers = [
            { key: 'name', label: t('stock.name')},
            { key: 'category', label: t('stock.category')},
            { key: 'stock', label: t('stock.currentStock')},
            { key: 'sellingPrice', label: t('stock.sellingPrice')},
        ];
        const data = filteredProducts.map(p => ({
            ...p,
            category: t(categoryToKeyMap[p.category] || p.category),
            sellingPrice: formatCurrency(p.sellingPrice)
        }));
        exportToPdf(t('stock.title'), headers, data, 'stock');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (isLoadingProducts) {
        return <div>{t('common.loading')}</div>;
    }

    if (isError) {
        return <div>Erreur lors du chargement des produits.</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">{t('stock.title')}</h2>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-between items-center flex-wrap gap-4 mb-4 no-print">
                    <div className="flex items-center gap-4 flex-wrap">
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                            <IconPlus className="h-4 w-4" />
                            <span>{t('configuration.addProduct')}</span>
                        </button>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IconSearch className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="search"
                                placeholder={t('stock.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#c6e911] focus:border-transparent transition"
                            />
                        </div>
                    </div>
                    <div className="flex space-x-2">
                         <button onClick={handlePrint} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                            <IconPrint className="h-4 w-4" />
                            <span>{t('common.print')}</span>
                        </button>
                        <button onClick={handleExport} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                            <IconExport className="h-4 w-4" />
                            <span>{t('common.export')}</span>
                        </button>
                        <button onClick={handleExportPdf} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                            <IconPdf className="h-4 w-4" />
                            <span>{t('common.exportPdf')}</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('stock.productId')}</th>
                                <th scope="col" className="px-6 py-3">{t('stock.name')}</th>
                                <th scope="col" className="px-6 py-3">{t('stock.range')}</th>
                                <th scope="col" className="px-6 py-3">{t('stock.category')}</th>
                                <th scope="col" className="px-6 py-3">{t('stock.warehouse')}</th>
                                <th scope="col" className="px-6 py-3">{t('stock.currentStock')}</th>
                                <th scope="col" className="px-6 py-3">{t('stock.costPrice')}</th>
                                <th scope="col" className="px-6 py-3">{t('stock.sellingPrice')}</th>
                                <th scope="col" className="px-6 py-3">{t('stock.margin')}</th>
                                <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => {
                                const isEditing = editingProductId === product.id;
                                const costPrice = isEditing ? editedPrices.cost : product.price;
                                const sellingPrice = isEditing ? editedPrices.selling : product.sellingPrice;
                                const margin = sellingPrice - costPrice;
                                const marginPercentage = costPrice > 0 ? (margin / costPrice) * 100 : 0;
                                
                                return (
                                <tr key={product.id} className="bg-white border-b hover:bg-slate-50">
                                    <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{product.id}</th>
                                    <td className="px-6 py-4 font-semibold">{product.productName}</td>
                                    <td className="px-6 py-4">{product.productRange ? t(rangeToKeyMap[product.productRange] || product.productRange) : ''}</td>
                                    <td className="px-6 py-4">{t(categoryToKeyMap[product.category] || product.category)}</td>
                                    <td className="px-6 py-4">{product.warehouse}</td>
                                    <td className={`px-6 py-4 text-center font-bold ${product.stock < 100 ? 'text-red-500' : 'text-green-600'}`}>
                                        {product.stock}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isEditing ? (
                                            <input type="number" value={editedPrices.cost} onChange={(e) => handlePriceChange(e, 'cost')} onKeyDown={handleKeyDown} className="w-24 p-1 border rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]" />
                                        ) : (
                                            formatCurrency(product.price)
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                         {isEditing ? (
                                            <input type="number" value={editedPrices.selling} onChange={(e) => handlePriceChange(e, 'selling')} onKeyDown={handleKeyDown} className="w-24 p-1 border rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]" />
                                        ) : (
                                            formatCurrency(product.sellingPrice)
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-sky-600">
                                        {`${formatCurrency(margin)} (${formatNumber(marginPercentage, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%)`}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center space-x-1">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-100 rounded-full" title={t('common.save')}>
                                                        <IconSaveCheck className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={handleCancel} className="p-2 text-red-600 hover:bg-red-100 rounded-full" title={t('common.cancel')}>
                                                        <IconCancelX className="h-5 w-5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleEdit(product)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full" title={t('common.edit')}>
                                                        <IconEdit className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(product)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full" title={t('common.delete')}>
                                                        <IconDelete className="h-5 w-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddModalOpen && (
                <ProductFormModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={handleSaveNewProduct}
                    product={null}
                />
            )}
            
            {productToDelete && (
                <ConfirmationModal 
                    isOpen={!!productToDelete}
                    onClose={() => setProductToDelete(null)}
                    onConfirm={confirmDelete}
                    title={t('configuration.modal.deleteProductTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: productToDelete.productName })}
                />
            )}
            
            {showSaveConfirm && (
                 <ConfirmationModal 
                    isOpen={showSaveConfirm}
                    onClose={() => setShowSaveConfirm(false)}
                    onConfirm={confirmSave}
                    title={t('stock.confirmPriceSaveTitle')}
                    message={t('stock.confirmPriceSaveMessage')}
                />
            )}
        </div>
    );
};

export default Stock;