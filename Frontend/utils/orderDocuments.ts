import type { Order } from '../types';

const amount = (value: unknown): number => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

/** Use persisted totals; only derive a line total for older local drafts. */
export const getOrderDocumentData = (order: Order) => {
    const items = order.orderItems?.length ? order.orderItems : (order.items ?? []);
    return {
        date: order.date || order.orderDate,
        totalAmount: amount(order.totalAmount),
        items: items.map(item => {
            const unitPrice = amount(item.unitPrice);
            const quantity = amount(item.quantity);
            return {
                productName: item.productName || item.product?.name || '—',
                quantity,
                unitPrice,
                total: item.total != null ? amount(item.total)
                    : unitPrice * quantity - amount(item.discount) + amount(item.assemblyPrice),
            };
        }),
    };
};

export const getOrderPaymentLabelKey = (method: string | null | undefined): string => {
    if (!method) return 'bonDeCommande.paymentNotSpecified';
    return ['CASH', 'BANK_TRANSFER', 'CHECK'].includes(method)
        ? `paymentMethods.${method}`
        : `newOrder.paymentMethod_${method}`;
};
