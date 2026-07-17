import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { useI18n } from '../../i18n';

interface OrderStatusUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

const OrderStatusUpdateModal: React.FC<OrderStatusUpdateModalProps> = ({ isOpen, onClose, order, onUpdateStatus }) => {
    const { t } = useI18n();
    const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);

    useEffect(() => {
        if (isOpen) {
            setNewStatus(order.status);
        }
    }, [isOpen, order]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateStatus(order.id, newStatus);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-bold text-slate-900">{t('sales.updateStatusModal.title')}</h3>
                        <p className="text-sm text-slate-500">{t('order.orderId')}: {order.id}</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-700">{t('sales.updateStatusModal.newStatus')}</label>
                            <select
                                id="status"
                                value={newStatus}
                                onChange={e => setNewStatus(e.target.value as OrderStatus)}
                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                            >
                                {Object.values(OrderStatus).map(status => (
                                    <option key={status} value={status}>
                                        {t(`order.status_${status}`)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors">{t('common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrderStatusUpdateModal;
