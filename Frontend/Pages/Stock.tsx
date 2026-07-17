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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductsBySubsidiary, createProduct, deleteProduct } from '../services/apiE-commerce/apiProducts';
import ConfirmationModal from '../components/common/ConfirmationModal';
import ProductFormModal from '../components/configuration/ProductFormModal';
import IconSaveCheck from '../components/icons/IconSaveCheck';
import IconCancelX from '../components/icons/IconCancelX';
import IconSearch from '../components/icons/IconSearch';
import { useAuth } from '../context/AuthContext';

const Stock: React.FC = () => {
    const { t, formatCurrency, formatNumber } = useI18n();
    const queryClient = useQueryClient();
    const { subsidiary } = useAuth();
    
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- TanStack Query: Data Fetching ---
    const { data: products = [], isLoading: isLoadingProducts, isError } = useQuery<Product[]>({
        queryKey: ['products', subsidiary?.id],
        queryFn: () => getProductsBySubsidiary(),
        enabled: !!subsidiary, // La requête ne s'exécute que si une filiale est définie
    });

    // --- TanStack Query: Mutations ---
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

    const lowStockProducts = useMemo(() => {
        return filteredProducts.filter(product => product.stock < 100).length;
    }, [filteredProducts]);

    const totalQuantity = useMemo(() => {
        return filteredProducts.reduce((total, product) => total + product.stock, 0);
    }, [filteredProducts]);

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
            { key: 'productName', label: t('stock.name')},
            { key: 'category', label: t('stock.category')},
            { key: 'stock', label: t('stock.currentStock')},
        ];
        const data = filteredProducts.map(p => ({
            ...p,
            category: t(categoryToKeyMap[p.category] || p.category),
        }));
        exportToPdf(t('stock.title'), headers, data, 'stock');
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
            
            {/* Tableau de bord - Statistiques du stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total des produits */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium opacity-90">Total des produits</h3>
                            <p className="text-2xl font-bold mt-1">{filteredProducts.length}</p>
                            <p className="text-xs opacity-75 mt-1">Références uniques</p>
                        </div>
                        <div className="bg-white bg-opacity-20 p-2 rounded-full">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Quantité totale en stock */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium opacity-90">Quantité totale</h3>
                            <p className="text-2xl font-bold mt-1">{formatNumber(totalQuantity)}</p>
                            <p className="text-xs opacity-75 mt-1">Unités en stock</p>
                        </div>
                        <div className="bg-white bg-opacity-20 p-2 rounded-full">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Alertes de stock */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium opacity-90">Produits en stock faible</h3>
                            <p className="text-2xl font-bold mt-1">{lowStockProducts}</p>
                            <p className="text-xs opacity-75 mt-1">Moins de 100 unités</p>
                        </div>
                        <div className="bg-white bg-opacity-20 p-2 rounded-full">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            
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
                                <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="bg-white border-b hover:bg-slate-50">
                                    <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{product.id}</th>
                                    <td className="px-6 py-4 font-semibold">{product.productName}</td>
                                    <td className="px-6 py-4">{product.range ? t(rangeToKeyMap[product.range] || product.range) : ''}</td>
                                    <td className="px-6 py-4">{t(categoryToKeyMap[product.category] || product.category)}</td>
                                    <td className="px-6 py-4">{product.warehouse}</td>
                                    <td className={`px-6 py-4 text-center font-bold ${product.stock < 100 ? 'text-red-500' : 'text-green-600'}`}>
                                        {product.stock}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center space-x-1">
                                            <button onClick={() => handleDelete(product)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full" title={t('common.delete')}>
                                                <IconDelete className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
        </div>
    );
};

export default Stock;