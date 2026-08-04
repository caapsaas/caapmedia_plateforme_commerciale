import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, recordOrderPayment } from '../../services/apiE-commerce/apiOrders';
import { useI18n } from '../../i18n';
import { CreditAccount, CustomerPaymentMethod, Order } from '../../types';
import EmptyState from '../ui/EmptyState';

interface CreditPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: CreditAccount;
}

const CreditPaymentModal: React.FC<CreditPaymentModalProps> = ({ isOpen, onClose, account }) => {
    const { t, formatCurrency } = useI18n();
    const queryClient = useQueryClient();

    const customerId = (account as any).contactId;
    const { data: result, isLoading: isLoadingOrders } = useQuery({
        queryKey: ['customerOrdersForPayment', customerId],
        queryFn: () => getOrders({ customerId }),
        enabled: !!customerId && isOpen,
    });

    const orders = Array.isArray(result) ? result : (result as any)?.data || [];
    const unpaidOrders = useMemo(() => orders.filter((o: Order) => o.paymentStatus !== 'PAID'), [orders]);

    const [selectedOrderId, setSelectedOrderId] = useState<string>('');
    const [amount, setAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<CustomerPaymentMethod>(CustomerPaymentMethod.CARD);

    useEffect(() => {
        if (unpaidOrders.length > 0 && !selectedOrderId) {
            const firstOrder = unpaidOrders[0];
            setSelectedOrderId(firstOrder.id);
            setAmount(firstOrder.totalAmount - firstOrder.amountPaid);
        }
    }, [unpaidOrders, selectedOrderId]);

    const selectedOrder = useMemo(() => unpaidOrders.find((o: Order) => o.id === selectedOrderId), [unpaidOrders, selectedOrderId]);
    const remainingBalance = selectedOrder ? selectedOrder.totalAmount - selectedOrder.amountPaid : 0;

    const { mutate: processPayment, isPending: isProcessing } = useMutation({
        mutationFn: recordOrderPayment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customerOrdersForPayment', customerId] });
            queryClient.invalidateQueries({ queryKey: ['credit'] });
            queryClient.invalidateQueries({ queryKey: ['totalReceivables'] });
            onClose();
        },
        onError: (error) => {
            console.error("Payment failed", error);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrderId || amount <= 0) return;
        processPayment({ orderId: selectedOrderId, amount, paymentMethod });
    };

    if (!isOpen) return null;

    const paymentMethods = Object.values(CustomerPaymentMethod).filter(
        method => ![CustomerPaymentMethod.CUSTOMER_CREDIT, CustomerPaymentMethod.PAY_ON_DELIVERY].includes(method)
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-xl font-bold text-slate-800">{t('credit.recordPayment')} - {account.clientName}</h3>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {isLoadingOrders ? (
                            <div className="space-y-4 animate-pulse">
                                <div>
                                    <div className="h-4 w-40 bg-slate-200 rounded mb-2" />
                                    <div className="h-9 w-full bg-slate-200 rounded" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
                                        <div className="h-9 w-full bg-slate-200 rounded" />
                                    </div>
                                    <div>
                                        <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
                                        <div className="h-9 w-full bg-slate-200 rounded" />
                                    </div>
                                </div>
                            </div>
                        ) : unpaidOrders.length === 0 ? (
                            <EmptyState icon="order" title="Aucune commande impayée à encaisser pour ce client." />
                        ) : (
                            <>
                                <div>
                                    <label htmlFor="orderId" className="block text-sm font-medium text-slate-700">Commande à encaisser</label>
                                    <select id="orderId" value={selectedOrderId} onChange={(e) => { const orderId = e.target.value; setSelectedOrderId(orderId); const order = unpaidOrders.find((o: Order) => o.id === orderId); if (order) { setAmount(order.totalAmount - order.amountPaid); } }} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm" required>
                                        {unpaidOrders.map((order: Order) => (
                                            <option key={order.id} value={order.id}>
                                                Commande {order.id.substring(0, 8)} du {new Date(order.date).toLocaleDateString()} - Solde: {formatCurrency(order.totalAmount - order.amountPaid)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {selectedOrderId && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="amount" className="block text-sm font-medium text-slate-700">Montant à encaisser</label>
                                            <input type="number" id="amount" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value))} max={remainingBalance} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm" required />
                                            <p className="text-xs text-slate-500 mt-1">Solde restant sur cette commande : {formatCurrency(remainingBalance)}</p>
                                        </div>
                                        <div>
                                            <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700">Moyen de paiement</label>
                                            <select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as CustomerPaymentMethod)} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm" required>
                                                {paymentMethods.map(method => (<option key={method} value={method}>{t(`payment.${method}`)}</option>))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">{t('common.cancel')}</button>
                        <button type="submit" disabled={isProcessing || !selectedOrderId || amount <= 0} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-slate-400">
                            {isProcessing ? t('common.loading') : t('credit.recordPayment')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreditPaymentModal;
