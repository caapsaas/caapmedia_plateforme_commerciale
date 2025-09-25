import React from 'react';
import { Order, OrderStatus } from '../../types';
import { useI18n } from '../../i18n';

interface OrderHistoryViewProps {
    orders: Order[];
}

const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({ orders }) => {
    const { t, formatCurrency } = useI18n();

    const getStatusClass = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.COMPLETED:
            case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800';
            case OrderStatus.PENDING_DELIVERY: return 'bg-yellow-100 text-yellow-800';
            case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getTranslatedStatus = (status: OrderStatus) => {
        return t(`order.status_${status}`);
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">{t('customerAccount.myOrders')}</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('customerAccount.orderId')}</th>
                            <th scope="col" className="px-6 py-3">{t('customerAccount.date')}</th>
                            <th scope="col" className="px-6 py-3">{t('customerAccount.total')}</th>
                            <th scope="col" className="px-6 py-3">{t('customerAccount.status')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{order.id}</td>
                                <td className="px-6 py-4">{order.date}</td>
                                <td className="px-6 py-4 font-bold">{formatCurrency(order.totalAmount)}</td>
                                <td className="px-6 py-4">
                                     <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(order.status)}`}>
                                        {getTranslatedStatus(order.status)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {orders.length === 0 && <p className="text-center py-8 text-slate-500">{t('myOrders.noOrders')}</p>}
            </div>
        </div>
    );
};

export default OrderHistoryView;