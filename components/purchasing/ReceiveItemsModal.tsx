import React, { useState } from 'react';
import { PurchaseOrder } from '../../types';
import { useI18n } from '../../i18n';

interface ReceiveItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    purchaseOrder: PurchaseOrder;
    onReceive: (poId: string, receivedItems: { productId: string, quantityReceived: number }[]) => void;
}

const ReceiveItemsModal: React.FC<ReceiveItemsModalProps> = ({ isOpen, onClose, purchaseOrder, onReceive }) => {
    const { t } = useI18n();
    const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});

    const handleQuantityChange = (productId: string, value: string) => {
        const quantity = parseInt(value, 10);
        const item = purchaseOrder.items.find(i => i.productId === productId);
        if (!item) return;
        
        const maxReceivable = item.quantity - item.quantityReceived;
        const newQuantity = isNaN(quantity) ? 0 : Math.max(0, Math.min(quantity, maxReceivable));

        setReceivedQuantities(prev => ({ ...prev, [productId]: newQuantity }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const itemsToReceive = Object.entries(receivedQuantities)
            .map(([productId, quantityReceived]) => ({ productId, quantityReceived }))
            .filter(item => item.quantityReceived > 0);
        
        if (itemsToReceive.length > 0) {
            onReceive(purchaseOrder.id, itemsToReceive);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-bold text-slate-900">{t('purchasing.receiveItemsModal.title')}</h3>
                        <p className="text-sm text-slate-500">{t('purchasing.poNumber')}: {purchaseOrder.id}</p>
                    </div>
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2">{t('purchasing.form.product')}</th>
                                        <th className="px-4 py-2 text-center">{t('purchasing.receiveItemsModal.ordered')}</th>
                                        <th className="px-4 py-2 text-center">{t('purchasing.receiveItemsModal.alreadyReceived')}</th>
                                        <th className="px-4 py-2 text-center">{t('purchasing.receiveItemsModal.quantityToReceive')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchaseOrder.items.map(item => {
                                        const remaining = item.quantity - item.quantityReceived;
                                        return (
                                            <tr key={item.productId} className="border-b">
                                                <td className="px-4 py-3 font-medium">{item.productName}</td>
                                                <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                <td className="px-4 py-3 text-center">{item.quantityReceived}</td>
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        max={remaining}
                                                        value={receivedQuantities[item.productId] || ''}
                                                        onChange={e => handleQuantityChange(item.productId, e.target.value)}
                                                        className="w-24 p-1 text-center border border-slate-300 rounded-md"
                                                        placeholder="0"
                                                        disabled={remaining === 0}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors">{t('common.confirm')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReceiveItemsModal;