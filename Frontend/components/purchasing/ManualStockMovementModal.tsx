import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StockItem, StockMovementType } from '../../types/models';
import { getStockItemsBySubsidiary } from '../../services/apiPurchasing/apiStockItems';
import { createStockMovement } from '../../services/apiPurchasing/apiStockMovements';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../i18n';

interface ManualStockMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Types déclenchables manuellement (Chantier 3) — miroir de MANUAL_MOVEMENT_TYPES
// côté backend (stock-movement.dto.ts). PURCHASE_RECEIPT/PRODUCTION_CONSUMPTION/
// *_ADJUSTMENT ont chacun leur propre flux dédié, pas ce formulaire générique.
const MANUAL_MOVEMENT_TYPES: StockMovementType[] = [
    StockMovementType.CUSTOMER_RETURN,
    StockMovementType.TRANSFER_IN,
    StockMovementType.TRANSFER_OUT,
    StockMovementType.LOSS,
    StockMovementType.BREAKAGE,
    StockMovementType.INTERNAL_CONSUMPTION,
    StockMovementType.SUPPLIER_RETURN,
];

const ManualStockMovementModal: React.FC<ManualStockMovementModalProps> = ({ isOpen, onClose }) => {
    const { t } = useI18n();
    const { subsidiary } = useAuth();
    const queryClient = useQueryClient();
    const toast = useToast();

    const [itemId, setItemId] = useState('');
    const [type, setType] = useState<StockMovementType>(StockMovementType.LOSS);
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');

    const { data: items = [] } = useQuery<StockItem[]>({
        queryKey: ['stockItems', subsidiary?.id],
        queryFn: () => getStockItemsBySubsidiary(),
        enabled: isOpen && !!subsidiary,
    });

    const createMutation = useMutation({
        mutationFn: createStockMovement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stockItems', subsidiary?.id] });
            queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
            toast.success(t('stockMovements.manual.successTitle'), t('stockMovements.manual.successMessage'));
            setItemId('');
            setQuantity('');
            setReason('');
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemId || !quantity || Number(quantity) <= 0) return;
        createMutation.mutate({ itemId, type, quantity: Number(quantity), reason: reason || undefined });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-bold text-slate-900">{t('stockMovements.manual.title')}</h3>
                        <p className="text-sm text-slate-500 mt-1">{t('stockMovements.manual.subtitle')}</p>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="itemId" className="block text-sm font-medium text-slate-700">{t('stockMovements.manual.product')}</label>
                            <select id="itemId" value={itemId} onChange={e => setItemId(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                <option value="">{t('stockMovements.manual.selectProduct')}</option>
                                {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-slate-700">{t('stockMovements.type')}</label>
                            <select id="type" value={type} onChange={e => setType(e.target.value as StockMovementType)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                {MANUAL_MOVEMENT_TYPES.map(movementType => (
                                    <option key={movementType} value={movementType}>{t(`stockMovements.types.${movementType}`)}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">{t('stockMovements.quantity')}</label>
                            <input type="number" id="quantity" min="0" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                        </div>

                        <div>
                            <label htmlFor="reason" className="block text-sm font-medium text-slate-700">{t('stockMovements.reason')}</label>
                            <input type="text" id="reason" value={reason} onChange={e => setReason(e.target.value)} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                        <button type="submit" disabled={!itemId || !quantity || createMutation.isPending} className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors">
                            {t('stockMovements.manual.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualStockMovementModal;
