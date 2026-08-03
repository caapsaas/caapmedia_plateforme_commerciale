import React from 'react';
import { getOrders } from '../../services/apiE-commerce/apiOrders';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../../i18n';
import { CreditAccount } from '../../types';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';



const CreditDetailsModal: React.FC<{ isOpen: boolean; onClose: () => void; account: CreditAccount }> = ({ isOpen, onClose, account }) => {
    const { t, formatCurrency } = useI18n();
    // On utilise contactId (l'ID du client) pour chercher ses commandes, et non l'ID du compte crédit
    const customerId = (account as any).contactId; 
    const { data: result = [], isLoading } = useQuery({
        queryKey: ['customerOrders', customerId],
        queryFn: () => getOrders({ customerId })
    });

    const orders = Array.isArray(result) ? result : (result as any).data || [];
    const unpaidOrders = orders.filter((o: any) => o.paymentStatus !== 'PAID');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">{t('credit.customerCreditTracking')} - {account.clientName}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {!isLoading && unpaidOrders.length === 0 ? (
                        <EmptyState icon="order" title="Aucune commande impayée trouvée." />
                    ) : (
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3">{t('order.orderId')}</th>
                                    <th className="px-6 py-3">{t('order.date')}</th>
                                    <th className="px-6 py-3 text-right">{t('order.total')}</th>
                                    <th className="px-6 py-3 text-right">{t('order.amountPaid')}</th>
                                    <th className="px-6 py-3 text-right">{t('order.remainingBalance')}</th>
                                    <th className="px-6 py-3 text-center">{t('order.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <TableSkeleton rows={4} columns={6} />
                                ) : unpaidOrders.map((order: any) => (
                                    <tr key={order.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium">{order.id}</td>
                                        <td className="px-6 py-4">{new Date(order.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">{formatCurrency(order.totalAmount)}</td>
                                        <td className="px-6 py-4 text-right">{formatCurrency(order.amountPaid)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-red-600">{formatCurrency(order.totalAmount - order.amountPaid)}</td>
                                        <td className="px-6 py-4 text-center">
                                             <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                order.paymentStatus === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {t(`order.paymentStatus_${order.paymentStatus}`)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="p-4 border-t bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreditDetailsModal;