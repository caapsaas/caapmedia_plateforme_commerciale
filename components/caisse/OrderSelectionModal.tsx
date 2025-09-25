import React, { useState, useMemo } from 'react';
import { Order, PaymentStatus, Contact } from '../../types';
import { useI18n } from '../../i18n';

interface OrderSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    orders: Order[];
    contacts: Contact[];
    onOrderSelect: (order: Order) => void;
}

const OrderSelectionModal: React.FC<OrderSelectionModalProps> = ({ isOpen, onClose, orders, contacts, onOrderSelect }) => {
    const { t, formatCurrency } = useI18n();
    const [searchTerm, setSearchTerm] = useState('');

    const searchableOrders = useMemo(() => {
        return orders.filter(order => order.paymentStatus !== PaymentStatus.PAID);
    }, [orders]);

    const filteredOrders = useMemo(() => {
        if (!searchTerm) return searchableOrders;

        const lowercasedTerm = searchTerm.toLowerCase();
        
        return searchableOrders.filter(order => {
            const customer = contacts.find(c => c.id === order.customerId);
            return (
                order.id.toLowerCase().includes(lowercasedTerm) ||
                order.customerName.toLowerCase().includes(lowercasedTerm) ||
                (customer && customer.phone.includes(lowercasedTerm))
            );
        });
    }, [searchableOrders, contacts, searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-lg font-bold text-slate-900">{t('cashRegister.orderSelectionModal.title')}</h3>
                </div>
                <div className="p-6">
                    <input
                        type="search"
                        placeholder={t('cashRegister.orderSelectionModal.searchPlaceholder')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-md mb-4"
                    />
                    <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">{t('order.orderId')}</th>
                                    <th className="px-4 py-2">{t('order.customer')}</th>
                                    <th className="px-4 py-2">{t('order.date')}</th>
                                    <th className="px-4 py-2 text-right">{t('order.remainingBalance')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredOrders.map(order => (
                                    <tr key={order.id} onClick={() => onOrderSelect(order)} className="hover:bg-slate-100 cursor-pointer">
                                        <td className="px-4 py-3 font-semibold">{order.id}</td>
                                        <td className="px-4 py-3">{order.customerName}</td>
                                        <td className="px-4 py-3">{order.date}</td>
                                        <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(order.totalAmount - order.amountPaid)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredOrders.length === 0 && (
                            <p className="text-center py-4 text-slate-500">{t('filter.noResults')}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSelectionModal;
