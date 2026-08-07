import React, { useState, useMemo } from 'react';
import { categoryToKeyMap, rangeToKeyMap } from '../constants';
import { StockItem, Subsidiary, UserRole } from '../types/models';
import { StockItemFormData } from '../types/forms';
import { useI18n } from '../i18n';
import { exportToCsv } from '../utils/csvExporter';
import { exportToPdf } from '../utils/pdfExporter';
import IconPrint from '../components/icons/IconPrint';
import IconExport from '../components/icons/IconExport';
import IconPdf from '../components/icons/IconPdf';
import IconPlus from '../components/icons/IconPlus';
import IconDelete from '../components/icons/IconDelete';
import IconSearch from '../components/icons/IconSearch';
import IconStock from '../components/icons/IconStock';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStockItemsBySubsidiary, createStockItem, deleteStockItem } from '../services/apiPurchasing/apiStockItems';
import { getSubsidiaries } from '../services/apiCommon/apiSubsidiaries';
import ConfirmationModal from '../components/common/ConfirmationModal';
import StockItemFormModal from '../components/configuration/StockItemFormModal';
import { useAuth } from '../context/AuthContext';
import StockMovementsJournal from '../components/purchasing/StockMovementsJournal';
import InventoryAdjustmentForm from '../components/purchasing/InventoryAdjustmentForm';
import { useToast } from '../context/ToastContext';

type StockView = 'levels' | 'movements' | 'inventory';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isLowStock = (item: StockItem) => item.minThreshold != null && item.stock < item.minThreshold;

const KpiCard: React.FC<{ label: string; value: string; sub?: string; alert?: boolean }> = ({ label, value, sub, alert }) => (
    <div className={`bg-white rounded-xl border p-5 ${alert ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${alert ? 'text-red-600' : 'text-slate-800'}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
);

// ─── Composant principal ──────────────────────────────────────────────────────
const Stock: React.FC = () => {
    const { t, formatCurrency } = useI18n();
    const toast = useToast();
    const queryClient = useQueryClient();
    const { subsidiary, user } = useAuth();

    // activeRole prime sur userRole (apercu de role SUPER_ADMIN, voir Purchasing.tsx pour le meme correctif).
    const isSuperAdmin = (user?.activeRole ?? user?.userRole) === UserRole.SUPER_ADMIN;

    const [activeTab, setActiveTab] = useState<StockView>('levels');
    const [subsidiaryFilter, setSubsidiaryFilter] = useState<string>('');
    const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Filiale effective : pour le SUPER_ADMIN, l'utilisateur choisit
    const effectiveSid = isSuperAdmin ? (subsidiaryFilter || undefined) : subsidiary?.id;

    const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
        queryKey: ['subsidiaries-list'],
        queryFn: getSubsidiaries,
        enabled: isSuperAdmin,
    });

    const { data: items = [], isLoading, isError } = useQuery<StockItem[]>({
        queryKey: ['stockItems', effectiveSid],
        queryFn: () => getStockItemsBySubsidiary(effectiveSid),
        enabled: isSuperAdmin || !!subsidiary,
    });

    const { mutate: createItemMutate } = useMutation({
        mutationFn: (itemData: StockItemFormData) => createStockItem(itemData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stockItems', effectiveSid] });
            setIsAddModalOpen(false);
            toast.success(t('configuration.addProduct'), '');
        },
    });

    const { mutate: deleteItemMutate } = useMutation({
        mutationFn: (id: string) => deleteStockItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stockItems', effectiveSid] });
            setItemToDelete(null);
            toast.success(t('common.deleted'), '');
        },
    });

    const filteredItems = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (!term) return items;
        return items.filter(item =>
            item.name.toLowerCase().includes(term) ||
            (item.description && item.description.toLowerCase().includes(term)) ||
            (item.sku && item.sku.toLowerCase().includes(term))
        );
    }, [items, searchTerm]);

    const totalValue = useMemo(() => filteredItems.reduce((s, i) => s + i.stock * (i.costPrice ?? 0), 0), [filteredItems]);
    const lowStockCount = useMemo(() => filteredItems.filter(isLowStock).length, [filteredItems]);
    const totalRefsInStock = useMemo(() => filteredItems.filter(i => i.stock > 0).length, [filteredItems]);

    const handlePrint = () => window.print();
    const handleExport = () => {
        exportToCsv('etat_stock', [
            { key: 'name', label: t('stock.name') },
            { key: 'category', label: t('stock.category') },
            { key: 'warehouse', label: t('stock.warehouse') },
            { key: 'stock', label: t('stock.currentStock') },
            { key: 'costPrice', label: t('stock.costPrice') },
        ], filteredItems.map(p => ({ ...p, category: t(categoryToKeyMap[p.category] || p.category) })));
    };
    const handleExportPdf = () => {
        exportToPdf(t('stock.title'), [
            { key: 'name', label: t('stock.name') },
            { key: 'category', label: t('stock.category') },
            { key: 'stock', label: t('stock.currentStock') },
            { key: 'costPrice', label: t('stock.costPrice') },
        ], filteredItems.map(p => ({ ...p, category: t(categoryToKeyMap[p.category] || p.category), costPrice: p.costPrice != null ? formatCurrency(Number(p.costPrice)) : '—' })), 'stock');
    };

    const TabButton: React.FC<{ view: StockView; label: string }> = ({ view, label }) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeTab === view ? 'bg-[#c6e911] text-slate-800 shadow' : 'text-slate-600 hover:bg-slate-200'
            }`}
        >
            {label}
        </button>
    );


    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800">{t('stock.title')}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Filtre filiale (SUPER_ADMIN) */}
                    {isSuperAdmin && subsidiaries.length > 0 && (
                        <select
                            value={subsidiaryFilter}
                            onChange={e => setSubsidiaryFilter(e.target.value)}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                        >
                            <option value="">Toutes les filiales</option>
                            {subsidiaries.map(s => (
                                <option key={s.id} value={s.id}>{s.subsidiaryName}</option>
                            ))}
                        </select>
                    )}
                    {/* Tabs */}
                    <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <TabButton view="levels" label={t('stockMovements.tabs.levels')} />
                        <TabButton view="movements" label={t('stockMovements.tabs.movements')} />
                        {!isSuperAdmin && <TabButton view="inventory" label={t('stockMovements.tabs.inventory')} />}
                    </nav>
                </div>
            </div>

            {/* Onglet Mouvements */}
            {activeTab === 'movements' && (
                <StockMovementsJournal subsidiaryId={effectiveSid} />
            )}

            {/* Onglet Inventaire */}
            {activeTab === 'inventory' && (
                <InventoryAdjustmentForm subsidiaryId={effectiveSid} />
            )}

            {/* Onglet Niveaux de stock */}
            {activeTab === 'levels' && (
                        <>
                            {/* KPI */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <KpiCard
                                    label="Valeur totale du stock"
                                    value={formatCurrency(totalValue)}
                                    sub={`${filteredItems.length} référence${filteredItems.length > 1 ? 's' : ''}`}
                                />
                                <KpiCard
                                    label="Produits en rupture"
                                    value={String(lowStockCount)}
                                    sub={t('stock.belowThreshold')}
                                    alert={lowStockCount > 0}
                                />
                                <KpiCard
                                    label="Références en stock"
                                    value={String(totalRefsInStock)}
                                    sub={`sur ${filteredItems.length} référence${filteredItems.length > 1 ? 's' : ''}`}
                                />
                            </div>

                            {/* Bandeau alerte ruptures */}
                            {lowStockCount > 0 && (
                                <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                    <span>⚠️</span>
                                    <span>
                                        <strong>{lowStockCount} produit{lowStockCount > 1 ? 's' : ''}</strong> sous le seuil minimum :{' '}
                                        {filteredItems.filter(isLowStock).map(i => i.name).join(', ')}.
                                    </span>
                                </div>
                            )}

                            {/* Tableau */}
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                {/* Barre d'outils */}
                                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 no-print">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {!isSuperAdmin && (
                                            <button
                                                onClick={() => setIsAddModalOpen(true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-bold rounded-lg hover:bg-[#adc40f] transition-colors"
                                            >
                                                <IconPlus className="h-4 w-4" />
                                                <span>{t('configuration.addProduct')}</span>
                                            </button>
                                        )}
                                        <div className="relative">
                                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input
                                                type="search"
                                                placeholder={t('stock.searchPlaceholder')}
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#c6e911] w-56"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                            <IconPrint className="h-4 w-4" /><span>{t('common.print')}</span>
                                        </button>
                                        <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                            <IconExport className="h-4 w-4" /><span>{t('common.export')}</span>
                                        </button>
                                        <button onClick={handleExportPdf} className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                            <IconPdf className="h-4 w-4" /><span>{t('common.exportPdf')}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide border-b border-slate-200">
                                            <tr>
                                                <th className="px-5 py-3 text-left font-semibold">{t('stock.name')}</th>
                                                <th className="px-5 py-3 text-left font-semibold">{t('stock.category')}</th>
                                                <th className="px-5 py-3 text-left font-semibold">{t('stock.warehouse')}</th>
                                                <th className="px-5 py-3 text-right font-semibold">{t('stock.currentStock')}</th>
                                                <th className="px-5 py-3 text-left font-semibold">Unité</th>
                                                <th className="px-5 py-3 text-right font-semibold">Seuil min.</th>
                                                <th className="px-5 py-3 text-right font-semibold">{t('stock.costPrice')}</th>
                                                {!isSuperAdmin && <th className="px-5 py-3 no-print"></th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {isLoading ? (
                                                Array.from({ length: 6 }).map((_, i) => (
                                                    <tr key={i}>
                                                        <td colSpan={isSuperAdmin ? 7 : 8} className="px-5 py-3">
                                                            <div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${55 + i * 7}%`, opacity: 1 - i * 0.12 }} />
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : isError ? (
                                                <tr>
                                                    <td colSpan={isSuperAdmin ? 7 : 8} className="py-16 text-center text-red-500 text-sm">
                                                        Erreur lors du chargement des produits de stock.
                                                    </td>
                                                </tr>
                                            ) : filteredItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={isSuperAdmin ? 7 : 8} className="py-20 text-center">
                                                        <IconStock className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                                                        <p className="font-medium text-slate-500">
                                                            {searchTerm ? 'Aucun résultat pour cette recherche.' : 'Aucune référence de stock enregistrée.'}
                                                        </p>
                                                        {searchTerm && (
                                                            <button onClick={() => setSearchTerm('')} className="mt-2 text-xs text-[#adc40f] hover:underline">
                                                                Effacer la recherche
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ) : filteredItems.map(item => {
                                                const low = isLowStock(item);
                                                const unit = item.baseUnit;
                                                return (
                                                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${low ? 'bg-red-50/30' : ''}`}>
                                                        <td className="px-5 py-3 font-semibold text-slate-800">{item.name}</td>
                                                        <td className="px-5 py-3 text-slate-500">{t(categoryToKeyMap[item.category] || item.category)}</td>
                                                        <td className="px-5 py-3 text-slate-500">{item.warehouse || '—'}</td>
                                                        <td className="px-5 py-3 text-right">
                                                            <span className={`font-bold ${low ? 'text-red-600' : 'text-slate-700'}`}>
                                                                {item.stock}
                                                            </span>
                                                            {low && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-600">Rupture</span>}
                                                        </td>
                                                        <td className="px-5 py-3 text-left text-slate-400 text-xs">
                                                            {unit ? (unit.symbol ?? unit.name) : '—'}
                                                        </td>
                                                        <td className="px-5 py-3 text-right text-slate-400 text-xs">
                                                            {item.minThreshold != null ? item.minThreshold : '—'}
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            {/* Prix de revient = dernier prix d'achat réel (voir
                                                                stock-items.service.ts::getLatestCostPrices) — plus
                                                                éditable manuellement depuis que `price` a été retiré
                                                                du schéma Item ; il vient désormais des Achats. */}
                                                            <span className={`font-semibold ${item.costPrice != null ? 'text-slate-700' : 'text-slate-300'}`} title={t('stock.costPriceHint')}>
                                                                {item.costPrice != null ? formatCurrency(Number(item.costPrice)) : '—'}
                                                            </span>
                                                        </td>
                                                        {!isSuperAdmin && (
                                                            <td className="px-5 py-3 no-print">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <button onClick={() => setItemToDelete(item)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={t('common.delete')}>
                                                                        <IconDelete className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

            {/* Modals */}
            {isAddModalOpen && (
                <StockItemFormModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={(data: StockItemFormData & { id?: string }) => createItemMutate(data)}
                    item={null}
                />
            )}

            {itemToDelete && (
                <ConfirmationModal
                    isOpen
                    onClose={() => setItemToDelete(null)}
                    onConfirm={() => deleteItemMutate(itemToDelete.id)}
                    title={t('configuration.modal.deleteProductTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: itemToDelete.name })}
                />
            )}

        </div>
    );
};

export default Stock;
