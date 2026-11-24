import React, { useState, useEffect } from 'react';
import { Order, OrderDeliveryInput, OrderStatus } from '../../types';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { allowedOrderTransitions } from '../../utils/orderWorkflow';

interface OrderStatusUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    isSaving: boolean;
    onUpdateStatus: (orderId: string, newStatus: OrderStatus, delivery?: OrderDeliveryInput, cancellationReason?: string) => void;
}

const OrderStatusUpdateModal: React.FC<OrderStatusUpdateModalProps> = ({ isOpen, onClose, order, isSaving, onUpdateStatus }) => {
    const { t } = useI18n();
    const { user } = useAuth();
    const role = user?.activeRole ?? user?.userRole;
    const allowedStatuses: OrderStatus[] = allowedOrderTransitions(order, role).filter(status => status !== OrderStatus.IN_PRODUCTION);
    const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);
    const [deliveryId] = useState(() => crypto.randomUUID());
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Africa/Douala' }).format(new Date());
    const [deliveredOn, setDeliveredOn] = useState(today);
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [packages, setPackages] = useState<Record<string, string>>({});
    const [reason, setReason] = useState('');
    const isCancellation = newStatus === OrderStatus.CANCELLED;
    const isDelivery = newStatus === OrderStatus.DELIVERED;
    const remainingLines = (order.orderItems ?? order.items ?? []).flatMap(item => {
        if (!item.id) return [];
        const delivered = (order.deliveries ?? []).reduce((sum, delivery) =>
            sum + (delivery.lines.find(line => line.orderItemId === item.id)?.deliveredQuantity ?? 0), 0);
        const remaining = item.quantity - delivered;
        return remaining > 0 ? [{ ...item, id: item.id, remaining }] : [];
    });
    const lines = remainingLines.map(item => ({
        orderItemId: item.id,
        deliveredQuantity: Number(quantities[item.id] ?? item.remaining),
        packageCount: packages[item.id] === undefined || packages[item.id] === '' ? NaN : Number(packages[item.id]),
    }));
    const canDeliver = deliveredOn !== '' && deliveredOn <= today &&
        lines.some(line => line.deliveredQuantity > 0) &&
        lines.every((line, index) =>
            Number.isInteger(line.deliveredQuantity) && line.deliveredQuantity >= 0 &&
            line.deliveredQuantity <= remainingLines[index].remaining &&
            (line.deliveredQuantity === 0 || (Number.isInteger(line.packageCount) && line.packageCount >= 0)));

    useEffect(() => {
        if (isOpen) {
            setNewStatus(allowedOrderTransitions(order, role).find(status => status !== OrderStatus.IN_PRODUCTION) ?? order.status);
        }
    }, [isOpen, order, role]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving || !allowedStatuses.includes(newStatus) || (isDelivery && !canDeliver) || (isCancellation && !reason.trim())) return;
        onUpdateStatus(order.id, newStatus, isDelivery ? {
            id: deliveryId,
            deliveredOn,
            lines: lines.filter(line => line.deliveredQuantity > 0),
        } : undefined, isCancellation ? reason.trim() : undefined);
    };

    if (!isOpen || allowedStatuses.length === 0) return null;

    return (
        <div className="fixed inset-0 modal-backdrop z-50 flex justify-center items-center p-4" onClick={() => { if (!isSaving) onClose(); }}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-bold text-slate-900">{t(isCancellation ? 'order.cancelOrder' : isDelivery ? 'order.confirmDelivery' : 'sales.updateStatusModal.title')}</h3>
                        <p className="text-sm text-slate-500">{t('order.orderId')}: {order.id}</p>
                    </div>
                    <div className="p-6 space-y-4">
                        {allowedStatuses.length > 1 && <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-700">{t('sales.updateStatusModal.newStatus')}</label>
                            <select
                                id="status"
                                value={newStatus}
                                disabled={isSaving}
                                onChange={e => setNewStatus(e.target.value as OrderStatus)}
                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                            >
                                {allowedStatuses.map(status => (
                                    <option key={status} value={status}>
                                        {t(`order.status_${status}`)}
                                    </option>
                                ))}
                            </select>
                        </div>}
                        {isCancellation && (
                            <label className="block text-sm font-medium text-slate-700">
                                {t('order.cancellationReason')}
                                <textarea required maxLength={1000} disabled={isSaving} value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2" />
                                <span className="mt-2 block text-slate-600">{t('order.cancellationImpact')}</span>
                            </label>
                        )}
                        {isDelivery && (
                            <fieldset disabled={isSaving} className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700">
                                    {t('bonDeLivraison.deliveryDate')}
                                    <input type="date" required max={today} value={deliveredOn} onChange={e => setDeliveredOn(e.target.value)}
                                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2" />
                                </label>
                                {remainingLines.map(item => (
                                    <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                                        <p className="font-semibold text-slate-900">{item.productName ?? item.product?.name ?? item.id}</p>
                                        <p className="text-slate-600">{t('bonDeLivraison.remainingQuantity', { remaining: item.remaining, ordered: item.quantity })}</p>
                                        <div className="mt-2 grid grid-cols-2 gap-3">
                                            <label className="text-slate-700">
                                                {t('bonDeLivraison.deliveredQuantity')}
                                                <input type="number" min={0} max={item.remaining} step={1}
                                                    value={quantities[item.id] ?? item.remaining}
                                                    onChange={e => setQuantities(current => ({ ...current, [item.id]: e.target.value }))}
                                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                                            </label>
                                            <label className="text-slate-700">
                                                {t('bonDeLivraison.packageCount')}
                                                <input type="number" min={0} step={1}
                                                    disabled={Number(quantities[item.id] ?? item.remaining) === 0}
                                                    value={packages[item.id] ?? ''}
                                                    onChange={e => setPackages(current => ({ ...current, [item.id]: e.target.value }))}
                                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100" />
                                            </label>
                                        </div>
                                    </div>
                                ))}
                                {remainingLines.length === 0 && <p className="text-sm text-slate-600">{t('bonDeLivraison.noData')}</p>}
                            </fieldset>
                        )}
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" disabled={isSaving} onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                        <button type="submit" disabled={isSaving || (isDelivery && !canDeliver) || (isCancellation && !reason.trim())} className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors disabled:opacity-50">{t(isSaving ? 'common.saving' : isCancellation ? 'order.cancelOrder' : isDelivery ? 'order.confirmDelivery' : 'common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrderStatusUpdateModal;
