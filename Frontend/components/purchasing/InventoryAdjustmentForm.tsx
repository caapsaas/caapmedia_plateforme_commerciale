import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StockItem } from '../../types/models';
import { getStockItemsBySubsidiary } from '../../services/apiPurchasing/apiStockItems';
import { adjustInventory } from '../../services/apiPurchasing/apiStockMovements';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../i18n';
import IconSearch from '../icons/IconSearch';

interface InventoryAdjustmentFormProps {
    subsidiaryId?: string;
}

const InventoryAdjustmentForm: React.FC<InventoryAdjustmentFormProps> = ({ subsidiaryId }) => {
    const { t } = useI18n();
    const { subsidiary } = useAuth();
    const queryClient = useQueryClient();
    const toast = useToast();

    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [countedStock, setCountedStock] = useState('');
    const [reason, setReason] = useState('');
    const [lastResult, setLastResult] = useState<{ delta: number; itemName: string } | null>(null);
    const [search, setSearch] = useState('');

    const effectiveSid = subsidiaryId ?? subsidiary?.id;

    const { data: items = [], isLoading } = useQuery<StockItem[]>({
        queryKey: ['stockItems', effectiveSid],
        queryFn: () => getStockItemsBySubsidiary(subsidiaryId),
        enabled: !!effectiveSid,
    });

    const filteredItems = useMemo(() => {
        const term = search.toLowerCase();
        return term ? items.filter(i => i.name.toLowerCase().includes(term)) : items;
    }, [items, search]);

    const adjustMutation = useMutation({
        mutationFn: adjustInventory,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['stockItems'] });
            queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
            setLastResult({
                delta: result.stock - (selectedItem?.stock ?? 0),
                itemName: selectedItem?.name ?? '',
            });
            toast.success(t('stockMovements.inventory.successTitle'), t('stockMovements.inventory.successMessage'));
            setCountedStock('');
            setReason('');
            setSelectedItem(null);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || countedStock === '') return;
        adjustMutation.mutate({ itemId: selectedItem.id, countedStock: Number(countedStock), reason: reason || undefined, subsidiaryId: subsidiaryId });
    };

    const handleSelect = (item: StockItem) => {
        setSelectedItem(item);
        setCountedStock('');
        setLastResult(null);
    };

    const unit = selectedItem?.baseUnit;
    const isLow = selectedItem && selectedItem.minThreshold != null && selectedItem.stock < selectedItem.minThreshold;
    const delta = countedStock !== '' ? Number(countedStock) - (selectedItem?.stock ?? 0) : null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">

            {/* ── Colonne gauche : liste des articles ───────────────────── */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-700 mb-2">{t('stockMovements.inventory.product')}</p>
                    <div className="relative">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Rechercher un produit…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                        />
                    </div>
                </div>

                <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
                    {isLoading ? (
                        <div className="p-4 space-y-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
                            ))}
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <p className="text-center text-sm text-slate-400 py-10">Aucun produit trouvé.</p>
                    ) : (
                        <ul className="divide-y divide-slate-50">
                            {filteredItems.map(item => {
                                const low = item.minThreshold != null && item.stock < item.minThreshold;
                                const isSelected = selectedItem?.id === item.id;
                                return (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => handleSelect(item)}
                                            className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                                                isSelected
                                                    ? 'bg-[#c6e911]/15 border-l-2 border-[#adc40f]'
                                                    : 'hover:bg-slate-50 border-l-2 border-transparent'
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <p className={`text-sm font-semibold truncate ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                                                    {item.name}
                                                </p>
                                                <p className="text-xs text-slate-400">{item.category}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`text-sm font-bold ${low ? 'text-red-600' : 'text-slate-700'}`}>
                                                    {item.stock}
                                                </span>
                                                <span className="text-xs text-slate-400 ml-1">
                                                    {item.baseUnit?.symbol ?? item.baseUnit?.name ?? ''}
                                                </span>
                                                {low && (
                                                    <span className="block text-[10px] text-red-500 font-semibold">Rupture</span>
                                                )}
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* ── Colonne droite : saisie + info article ────────────────── */}
            <div className="lg:col-span-3 space-y-4">

                {/* Résultat du dernier ajustement */}
                {lastResult && (
                    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
                        lastResult.delta === 0
                            ? 'bg-slate-50 border-slate-200 text-slate-600'
                            : lastResult.delta > 0
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        <span className="text-lg leading-none">
                            {lastResult.delta === 0 ? '✓' : lastResult.delta > 0 ? '▲' : '▼'}
                        </span>
                        <div>
                            <p className="font-semibold">{lastResult.itemName}</p>
                            <p>
                                {lastResult.delta === 0
                                    ? t('stockMovements.inventory.noDeviation')
                                    : t('stockMovements.inventory.deviationRecorded', {
                                        delta: (lastResult.delta > 0 ? '+' : '') + lastResult.delta,
                                    })}
                            </p>
                        </div>
                    </div>
                )}

                {/* Fiche article sélectionné */}
                {selectedItem ? (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        {/* En-tête article */}
                        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Article sélectionné</p>
                                <h3 className="text-base font-bold text-slate-800">{selectedItem.name}</h3>
                                <p className="text-sm text-slate-500">{selectedItem.category}</p>
                            </div>
                            <button type="button" onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none mt-0.5">×</button>
                        </div>

                        {/* Stats article */}
                        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                            <div className="px-5 py-4 text-center">
                                <p className="text-xs text-slate-400 mb-1">Stock théorique</p>
                                <p className={`text-xl font-bold ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                                    {selectedItem.stock}
                                    <span className="text-sm font-normal text-slate-400 ml-1">{unit?.symbol ?? unit?.name ?? ''}</span>
                                </p>
                            </div>
                            <div className="px-5 py-4 text-center">
                                <p className="text-xs text-slate-400 mb-1">Seuil minimum</p>
                                <p className="text-xl font-bold text-slate-700">
                                    {selectedItem.minThreshold ?? '—'}
                                    {selectedItem.minThreshold != null && <span className="text-sm font-normal text-slate-400 ml-1">{unit?.symbol ?? unit?.name ?? ''}</span>}
                                </p>
                            </div>
                            <div className="px-5 py-4 text-center">
                                <p className="text-xs text-slate-400 mb-1">Entrepôt</p>
                                <p className="text-sm font-semibold text-slate-700">{selectedItem.warehouse || '—'}</p>
                            </div>
                        </div>

                        {/* Formulaire d'ajustement */}
                        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                        {t('stockMovements.inventory.countedStock')}
                                        {unit && <span className="ml-1 text-slate-400">({unit.symbol ?? unit.name})</span>}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={countedStock}
                                        onChange={e => setCountedStock(e.target.value)}
                                        required
                                        autoFocus
                                        placeholder="0"
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                    />
                                    {/* Aperçu de l'écart en temps réel */}
                                    {delta !== null && (
                                        <p className={`mt-1.5 text-xs font-semibold ${delta === 0 ? 'text-slate-400' : delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            Écart : {delta > 0 ? '+' : ''}{delta} {unit?.symbol ?? unit?.name ?? ''}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                        {t('stockMovements.inventory.reason')}
                                    </label>
                                    <input
                                        type="text"
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        placeholder="Inventaire physique, casse…"
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!countedStock || adjustMutation.isPending}
                                className="w-full py-2.5 bg-[#c6e911] text-slate-800 text-sm font-bold rounded-lg hover:bg-[#adc40f] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {adjustMutation.isPending ? 'Enregistrement…' : t('stockMovements.inventory.submit')}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* Placeholder quand rien n'est sélectionné */
                    <div className="bg-white rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center py-20 text-center">
                        <svg className="w-10 h-10 text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm font-medium text-slate-400">Sélectionnez un produit</p>
                        <p className="text-xs text-slate-300 mt-1">dans la liste à gauche pour saisir le stock compté</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryAdjustmentForm;
