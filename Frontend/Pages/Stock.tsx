import React, { useState, useMemo } from 'react';
import { categoryToKeyMap, rangeToKeyMap } from '../constants';
import { StockItem } from '../types/models';
import { StockItemFormData } from '../types/forms';
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
import { getStockItemsBySubsidiary, createStockItem, deleteStockItem, updateStockItemPrice } from '../services/apiPurchasing/apiStockItems';
import ConfirmationModal from '../components/common/ConfirmationModal';
import StockItemFormModal from '../components/configuration/StockItemFormModal';
import IconSaveCheck from '../components/icons/IconSaveCheck';
import IconCancelX from '../components/icons/IconCancelX';
import IconSearch from '../components/icons/IconSearch';
import { useAuth } from '../context/AuthContext';
import StockMovementsJournal from '../components/purchasing/StockMovementsJournal';
import InventoryAdjustmentForm from '../components/purchasing/InventoryAdjustmentForm';

type StockView = 'levels' | 'movements' | 'inventory';

const Stock: React.FC = () => {
    const { t, formatCurrency } = useI18n();
    const queryClient = useQueryClient();
    const { subsidiary } = useAuth();
    const [activeTab, setActiveTab] = useState<StockView>('levels');

    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editedPrice, setEditedPrice] = useState<number>(0);
    const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- TanStack Query: Data Fetching ---
    const { data: items = [], isLoading: isLoadingItems, isError } = useQuery<StockItem[]>({
        queryKey: ['stockItems', subsidiary?.id],
        queryFn: () => getStockItemsBySubsidiary(),
        enabled: !!subsidiary, // La requête ne s'exécute que si une filiale est définie
    });

    // --- TanStack Query: Mutations ---
    const { mutate: updatePriceMutate } = useMutation({
        mutationFn: ({ id, price }: { id: string, price: number }) => updateStockItemPrice(id, price),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stockItems', subsidiary?.id] });
        },
    });

    const { mutate: createItemMutate } = useMutation({
        mutationFn: (itemData: StockItemFormData) => createStockItem(itemData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stockItems', subsidiary?.id] });
            setIsAddModalOpen(false);
        },
    });

    const { mutate: deleteItemMutate } = useMutation({
        mutationFn: (id: string) => deleteStockItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stockItems', subsidiary?.id] });
            setItemToDelete(null);
        },
    });

    if (!subsidiary) {
        return <div>{t('common.loading')}</div>;
    }

    const filteredItems = useMemo(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        if (!lowercasedTerm) {
            return items;
        }
        return items.filter(item =>
            item.name.toLowerCase().includes(lowercasedTerm) ||
            item.id.toLowerCase().includes(lowercasedTerm) ||
            (item.description && item.description.toLowerCase().includes(lowercasedTerm))
        );
    }, [items, searchTerm]);

    const totalInventoryValue = useMemo(() => {
        return filteredItems.reduce((total, item) => total + (item.stock * item.price), 0);
    }, [filteredItems]);

    // Alerte basée sur le seuil minimum propre à chaque produit (Chantier 1/3) —
    // les produits sans seuil défini ne déclenchent jamais d'alerte.
    const isLowStock = (item: StockItem) => item.minThreshold != null && item.stock < item.minThreshold;
    const lowStockItems = useMemo(() => {
        return filteredItems.filter(isLowStock).length;
    }, [filteredItems]);

    const averagePrice = useMemo(() => {
        const totalPrice = filteredItems.reduce((total, item) => total + item.price, 0);
        return filteredItems.length > 0 ? totalPrice / filteredItems.length : 0;
    }, [filteredItems]);

    const handleEdit = (item: StockItem) => {
        setEditingItemId(item.id);
        setEditedPrice(item.price);
    };

    const handleCancel = () => {
        setEditingItemId(null);
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setEditedPrice(isNaN(value) ? 0 : value);
    };

    const handleSave = () => {
        if (editingItemId) {
            setShowSaveConfirm(true);
        }
    };

    const confirmSave = () => {
        if (!editingItemId) return;

        updatePriceMutate({ id: editingItemId, price: editedPrice });
        setShowSaveConfirm(false);
        setEditingItemId(null);
    };

    const handleDelete = (item: StockItem) => {
        setItemToDelete(item);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            deleteItemMutate(itemToDelete.id);
        }
    };

    const handleSaveNewItem = (itemData: StockItemFormData & { id?: string }) => {
        createItemMutate(itemData);
    };

    const handlePrint = () => window.print();

    const handleExport = () => {
        const headers = [
            { key: 'id', label: t('stock.productId')},
            { key: 'name', label: t('stock.name')},
            { key: 'productRange', label: t('stock.range')},
            { key: 'category', label: t('stock.category')},
            { key: 'description', label: t('stock.description')},
            { key: 'warehouse', label: t('stock.warehouse')},
            { key: 'stock', label: t('stock.currentStock')},
            { key: 'price', label: t('stock.costPrice')},
        ];
        const data = filteredItems.map(p => ({
            ...p,
            category: t(categoryToKeyMap[p.category] || p.category),
            productRange: p.productRange ? t(rangeToKeyMap[p.productRange] || p.productRange) : '',
        }));
        exportToCsv('etat_stock', headers, data);
    };

    const handleExportPdf = () => {
        const headers = [
            { key: 'name', label: t('stock.name')},
            { key: 'category', label: t('stock.category')},
            { key: 'stock', label: t('stock.currentStock')},
            { key: 'price', label: t('stock.costPrice')},
        ];
        const data = filteredItems.map(p => ({
            ...p,
            category: t(categoryToKeyMap[p.category] || p.category),
            price: formatCurrency(p.price)
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

    if (isLoadingItems) {
        return <div>{t('common.loading')}</div>;
    }

    if (isError) {
        return <div>Erreur lors du chargement des produits de stock.</div>;
    }

    const TabButton: React.FC<{ view: StockView; label: string }> = ({ view, label }) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c6e911] ${
                activeTab === view ? 'bg-[#c6e911] text-slate-800 shadow' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4 no-print">
                <h2 className="text-3xl font-bold text-slate-800">{t('stock.title')}</h2>
                <div className="flex items-center space-x-2 p-1 bg-slate-200 rounded-lg">
                    <TabButton view="levels" label={t('stockMovements.tabs.levels')} />
                    <TabButton view="movements" label={t('stockMovements.tabs.movements')} />
                    <TabButton view="inventory" label={t('stockMovements.tabs.inventory')} />
                </div>
            </div>

            {activeTab === 'movements' && <StockMovementsJournal />}
            {activeTab === 'inventory' && <InventoryAdjustmentForm />}

            {activeTab === 'levels' && (
            <>
            {/* Tableau de bord - Statistiques du stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium opacity-90">Valeur totale du stock</h3>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(totalInventoryValue)}</p>
                            <p className="text-xs opacity-75 mt-1">Stock × Prix d'achat</p>
                        </div>
                        <div className="bg-white bg-opacity-20 p-2 rounded-full">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium opacity-90">Produits en stock faible</h3>
                            <p className="text-2xl font-bold mt-1">{lowStockItems}</p>
                            <p className="text-xs opacity-75 mt-1">{t('stock.belowThreshold')}</p>
                        </div>
                        <div className="bg-white bg-opacity-20 p-2 rounded-full">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-slate-600">Prix d'achat moyen</h3>
                            <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(averagePrice)}</p>
                            <p className="text-xs text-slate-500 mt-1">Par référence ({filteredItems.length})</p>
                        </div>
                        <div className="bg-blue-100 p-2 rounded-full">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
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
                                <th scope="col" className="px-6 py-3">{t('stock.costPrice')}</th>
                                <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => {
                                const isEditing = editingItemId === item.id;
                                const price = isEditing ? editedPrice : item.price;

                                return (
                                <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                                    <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{item.id}</th>
                                    <td className="px-6 py-4 font-semibold">{item.name}</td>
                                    <td className="px-6 py-4">{item.productRange ? t(rangeToKeyMap[item.productRange] || item.productRange) : ''}</td>
                                    <td className="px-6 py-4">{t(categoryToKeyMap[item.category] || item.category)}</td>
                                    <td className="px-6 py-4">{item.warehouse}</td>
                                    <td className={`px-6 py-4 text-center font-bold ${isLowStock(item) ? 'text-red-500' : 'text-green-600'}`}>
                                        {item.stock}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isEditing ? (
                                            <input type="number" value={price} onChange={handlePriceChange} onKeyDown={handleKeyDown} className="w-24 p-1 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911]" />
                                        ) : (
                                            formatCurrency(item.price)
                                        )}
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
                                                    <button onClick={() => handleEdit(item)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full" title={t('common.edit')}>
                                                        <IconEdit className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(item)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full" title={t('common.delete')}>
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
            </>
            )}

            {isAddModalOpen && (
                <StockItemFormModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={handleSaveNewItem}
                    item={null}
                />
            )}

            {itemToDelete && (
                <ConfirmationModal
                    isOpen={!!itemToDelete}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={confirmDelete}
                    title={t('configuration.modal.deleteProductTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: itemToDelete.name })}
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
