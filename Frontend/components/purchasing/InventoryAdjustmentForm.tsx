import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StockItem } from '../../types/models';
import { getStockItemsBySubsidiary } from '../../services/apiPurchasing/apiStockItems';
import { adjustInventory } from '../../services/apiPurchasing/apiStockMovements';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../i18n';

// Module Inventaire (Chantier 3) : l'utilisateur saisit le stock réellement
// compté, le système calcule l'écart et génère automatiquement un mouvement
// d'ajustement (positif ou négatif) — jamais de saisie manuelle du mouvement.
const InventoryAdjustmentForm: React.FC = () => {
    const { t } = useI18n();
    const { subsidiary } = useAuth();
    const queryClient = useQueryClient();
    const toast = useToast();

    const [itemId, setItemId] = useState('');
    const [countedStock, setCountedStock] = useState('');
    const [reason, setReason] = useState('');
    const [lastResult, setLastResult] = useState<{ delta: number; theoretical: number } | null>(null);

    const { data: items = [] } = useQuery<StockItem[]>({
        queryKey: ['stockItems', subsidiary?.id],
        queryFn: () => getStockItemsBySubsidiary(),
        enabled: !!subsidiary,
    });

    const selectedItem = items.find(i => i.id === itemId);

    const adjustMutation = useMutation({
        mutationFn: adjustInventory,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['stockItems', subsidiary?.id] });
            queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
            if (selectedItem) {
                setLastResult({ delta: result.stock - selectedItem.stock, theoretical: selectedItem.stock });
            }
            toast.success(t('stockMovements.inventory.successTitle'), t('stockMovements.inventory.successMessage'));
            setItemId('');
            setCountedStock('');
            setReason('');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemId || countedStock === '') return;
        adjustMutation.mutate({ itemId, countedStock: Number(countedStock), reason: reason || undefined });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md max-w-2xl">
            <h3 className="text-xl font-semibold text-slate-800 mb-1">{t('stockMovements.inventory.title')}</h3>
            <p className="text-sm text-slate-500 mb-4">{t('stockMovements.inventory.subtitle')}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="itemId" className="block text-sm font-medium text-slate-700">{t('stockMovements.inventory.product')}</label>
                    <select id="itemId" value={itemId} onChange={e => { setItemId(e.target.value); setLastResult(null); }} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                        <option value="">{t('stockMovements.inventory.selectProduct')}</option>
                        {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                </div>

                {selectedItem && (
                    <p className="text-sm text-slate-500">
                        {t('stockMovements.inventory.theoreticalStock')} : <span className="font-semibold text-slate-700">{selectedItem.stock}</span>
                    </p>
                )}

                <div>
                    <label htmlFor="countedStock" className="block text-sm font-medium text-slate-700">{t('stockMovements.inventory.countedStock')}</label>
                    <input type="number" id="countedStock" min="0" step="0.01" value={countedStock} onChange={e => setCountedStock(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                </div>

                <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-slate-700">{t('stockMovements.inventory.reason')}</label>
                    <input type="text" id="reason" value={reason} onChange={e => setReason(e.target.value)} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                </div>

                <button type="submit" disabled={!itemId || countedStock === '' || adjustMutation.isPending} className="w-full py-2 bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#adc40f] disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors">
                    {t('stockMovements.inventory.submit')}
                </button>
            </form>

            {lastResult && (
                <div className={`mt-4 p-3 rounded-md text-sm ${lastResult.delta === 0 ? 'bg-slate-100 text-slate-600' : lastResult.delta > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {lastResult.delta === 0
                        ? t('stockMovements.inventory.noDeviation')
                        : t('stockMovements.inventory.deviationRecorded', { delta: (lastResult.delta > 0 ? '+' : '') + lastResult.delta })}
                </div>
            )}
        </div>
    );
};

export default InventoryAdjustmentForm;
