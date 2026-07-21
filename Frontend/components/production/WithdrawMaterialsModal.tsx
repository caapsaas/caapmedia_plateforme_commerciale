import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StockItem } from '../../types/models';
import { getStockItemsBySubsidiary } from '../../services/apiPurchasing/apiStockItems';
import { withdrawForOrder } from '../../services/apiPurchasing/apiStockMovements';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import IconDelete from '../icons/IconDelete';

interface WithdrawMaterialsModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
}

interface WithdrawLine {
    itemId: string;
    quantity: number;
}

// "Prélever les matières" (Chantier 3) — depuis une commande en production, le
// responsable saisit manuellement les quantités réellement utilisées. Jamais
// calculé depuis la commande : le lien à orderId n'est là que pour la traçabilité.
const WithdrawMaterialsModal: React.FC<WithdrawMaterialsModalProps> = ({ isOpen, onClose, orderId }) => {
    const { t } = useI18n();
    const { subsidiary } = useAuth();
    const queryClient = useQueryClient();
    const toast = useToast();

    const [lines, setLines] = useState<WithdrawLine[]>([]);
    const [itemId, setItemId] = useState('');
    const [quantity, setQuantity] = useState('');

    const { data: items = [] } = useQuery<StockItem[]>({
        queryKey: ['stockItems', subsidiary?.id],
        queryFn: () => getStockItemsBySubsidiary(),
        enabled: isOpen && !!subsidiary,
    });

    const withdrawMutation = useMutation({
        mutationFn: withdrawForOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stockItems', subsidiary?.id] });
            queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
            toast.success(t('stockMovements.withdraw.successTitle'), t('stockMovements.withdraw.successMessage'));
            setLines([]);
            onClose();
        },
    });

    const handleAddLine = () => {
        if (!itemId || !quantity || Number(quantity) <= 0) return;
        setLines(prev => [...prev, { itemId, quantity: Number(quantity) }]);
        setItemId('');
        setQuantity('');
    };

    const handleRemoveLine = (index: number) => {
        setLines(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (lines.length === 0) return;
        withdrawMutation.mutate({ orderId, items: lines });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-lg font-bold text-slate-900">{t('stockMovements.withdraw.title')}</h3>
                    <p className="text-sm text-slate-500 mt-1">{t('stockMovements.withdraw.subtitle')}</p>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                    <div className="grid grid-cols-12 gap-2 items-center">
                        <select value={itemId} onChange={e => setItemId(e.target.value)} className="col-span-7 border-slate-300 rounded-md shadow-sm py-2 px-3 border text-sm">
                            <option value="">{t('stockMovements.withdraw.product')}</option>
                            {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            placeholder={t('stockMovements.withdraw.quantity')}
                            className="col-span-3 border-slate-300 rounded-md shadow-sm py-2 px-3 border text-sm"
                        />
                        <button type="button" onClick={handleAddLine} disabled={!itemId || !quantity} className="col-span-2 flex items-center justify-center p-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 disabled:opacity-50">
                            <IconPlus className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {lines.map((line, index) => {
                            const item = items.find(i => i.id === line.itemId);
                            return (
                                <div key={index} className="flex items-center justify-between text-sm bg-slate-50 rounded-md px-3 py-2">
                                    <span>{item?.name ?? line.itemId} — {line.quantity}</span>
                                    <button type="button" onClick={() => handleRemoveLine(index)} className="p-1 text-red-500 hover:bg-red-100 rounded-full">
                                        <IconDelete className="h-4 w-4" />
                                    </button>
                                </div>
                            );
                        })}
                        {lines.length === 0 && (
                            <p className="text-sm text-slate-400 italic">{t('stockMovements.withdraw.empty')}</p>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={lines.length === 0 || withdrawMutation.isPending}
                        className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {t('stockMovements.withdraw.submit')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WithdrawMaterialsModal;
