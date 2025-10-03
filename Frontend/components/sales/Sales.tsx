

import React, { useState, useMemo } from 'react';
import { Order, PaymentStatus, OrderStatus } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { useI18n } from '../../i18n';
import IconDocumentText from '../icons/IconDocumentText';
import BonDeLivraison from '../BonDeLivraison';
import SelectFilter from '../filters/SelectFilter';
import PeriodFilter from '../filters/PeriodFilter';
import IconInvoice from '../icons/IconInvoice';
import InvoiceModal from '../InvoiceModal';
import RecordPaymentModal from './RecordPaymentModal';
import OrderStatusUpdateModal from './OrderStatusUpdateModal';
import IconCoins from '../icons/IconCoins';
import IconEdit from '../icons/IconEdit';
import IconChevronDown from '../icons/IconChevronDown';
import IconExclamationTriangle from '../icons/IconExclamationTriangle';
import IconCheckCircle from '../icons/IconCheckCircle';

const initialFilterState = {
    client: '',
    product: '',
    period: 'all_time',
    startDate: '',
    endDate: '',
    orderStatus: '',
    paymentStatus: '',
};

const Sales: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { t, formatCurrency } = useI18n();

    const { currentSubsidiary: subsidiary, currentUser, orders, products, contacts } = state;

    if (!subsidiary || !currentUser) {
        // This should ideally be handled by a protected route, but this is a safeguard.
        return <div>Chargement ou erreur d'authentification...</div>;
    }

    const onRecordPayment = (orderId: string, amount: number) => 
        dispatch({ type: 'RECORD_ORDER_PAYMENT', payload: { orderId, amount } });
    const onUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => 
        dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, newStatus } });
    const onValidateForProduction = (orderId: string) => 
        dispatch({ type: 'VALIDATE_ORDER_FOR_PRODUCTION', payload: orderId });
    
    // State for modals
    const [payingOrder, setPayingOrder] = useState<Order | null>(null);
    const [updatingStatusOrder, setUpdatingStatusOrder] = useState<Order | null>(null);
    const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
    const [blOrder, setBlOrder] = useState<Order | null>(null);
    
    // State for filters
    const [filters, setFilters] = useState(initialFilterState);
    const [appliedFilters, setAppliedFilters] = useState(initialFilterState);
    
    // State for UI toggles
    const [showOrderHistory, setShowOrderHistory] = useState(true);
    const [showTopProducts, setShowTopProducts] = useState(true);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const handleApplyFilters = () => {
        setAppliedFilters(filters);
    };

    const handleResetFilters = () => {
        setFilters(initialFilterState);
        setAppliedFilters(initialFilterState);
    };

    const filteredOrders = useMemo(() => {
        let filtered = orders.filter(o => o.subsidiaryId === subsidiary.id);

        if (appliedFilters.client) {
            filtered = filtered.filter(o => o.customerId === appliedFilters.client);
        }
        if (appliedFilters.product) {
            filtered = filtered.filter(o => o.items.some(item => item.product.id === appliedFilters.product));
        }
        if (appliedFilters.orderStatus) {
            filtered = filtered.filter(o => o.status === appliedFilters.orderStatus);
        }
        if (appliedFilters.paymentStatus) {
            filtered = filtered.filter(o => o.paymentStatus === appliedFilters.paymentStatus);
        }

        if (appliedFilters.period !== 'all_time') {
            const now = new Date();
            let startPeriodDate = new Date();
            let endPeriodDate = new Date(now);

            if (appliedFilters.period === 'custom' && appliedFilters.startDate && appliedFilters.endDate) {
                startPeriodDate = new Date(appliedFilters.startDate);
                endPeriodDate = new Date(appliedFilters.endDate);
                endPeriodDate.setHours(23, 59, 59, 999);
            } else {
                startPeriodDate.setHours(0, 0, 0, 0);
                switch (appliedFilters.period) {
                    case 'this_month':
                        startPeriodDate = new Date(now.getFullYear(), now.getMonth(), 1);
                        endPeriodDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        break;
                    case 'last_month':
                        startPeriodDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        endPeriodDate = new Date(now.getFullYear(), now.getMonth(), 0);
                        break;
                    case 'seven_days': startPeriodDate.setDate(now.getDate() - 6); break;
                    case 'thirty_days': startPeriodDate.setDate(now.getDate() - 29); break;
                    case 'ninety_days': startPeriodDate.setDate(now.getDate() - 89); break;
                    case 'year': startPeriodDate = new Date(now.getFullYear(), 0, 1); break;
                }
            }
            
            filtered = filtered.filter(o => {
                const orderDate = new Date(o.date);
                return orderDate >= startPeriodDate && orderDate <= endPeriodDate;
            });
        }
        
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, subsidiary.id, appliedFilters]);

    const topSellingProducts = useMemo(() => {
        const productStats: { [key: string]: { name: string; quantity: number; revenue: number } } = {};

        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                const { product, quantity, price } = item;
                if (!productStats[product.id]) {
                    productStats[product.id] = { name: product.name, quantity: 0, revenue: 0 };
                }
                productStats[product.id].quantity += quantity;
                productStats[product.id].revenue += price * quantity;
            });
        });

        return Object.values(productStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
    }, [filteredOrders]);


    const clientOptions = useMemo(() => contacts.map(c => ({ value: c.id, label: `${c.name} (${c.company || 'N/A'})` })), [contacts]);
    const productOptions = useMemo(() => products.map(p => ({ value: p.id, label: p.name })), [products]);
    const orderStatusOptions = useMemo(() => Object.values(OrderStatus).map(s => ({ value: s, label: t(`order.status_${s}`) })), [t]);
    const paymentStatusOptions = useMemo(() => Object.values(PaymentStatus).map(s => ({ value: s, label: t(`order.paymentStatus_${s}`) })), [t]);
    
    const getPaymentStatusClass = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.PAID: return 'bg-green-100 text-green-800';
            case PaymentStatus.PARTIALLY_PAID: return 'bg-yellow-100 text-yellow-800';
            case PaymentStatus.UNPAID: return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getOrderStatusClass = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.COMPLETED:
            case OrderStatus.DELIVERED:
                return 'bg-green-100 text-green-800';
            case OrderStatus.IN_PRODUCTION:
            case OrderStatus.PENDING_DELIVERY:
                 return 'bg-yellow-100 text-yellow-800';
            case OrderStatus.PENDING_VALIDATION:
                 return 'bg-blue-100 text-blue-800';
            case OrderStatus.CANCELLED:
                return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };
    
    const clientForInvoice = useMemo(() => {
        if (!invoiceOrder) return null;
        return contacts.find(c => c.id === invoiceOrder.customerId);
    }, [invoiceOrder, contacts]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">{t('sidebar.orders')}</h2>
            
            {/* Order History Section */}
            <div className="bg-white rounded-xl shadow-md">
                <button
                    onClick={() => setShowOrderHistory(!showOrderHistory)}
                    className="w-full p-4 text-left flex justify-between items-center"
                >
                    <h3 className="text-xl font-semibold text-slate-800">{t('sales.orderHistoryTitle')}</h3>
                    <IconChevronDown className={`h-6 w-6 transition-transform ${showOrderHistory ? 'rotate-180' : ''}`} />
                </button>
                {showOrderHistory && (
                    <div className="p-6 pt-0 space-y-4">
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <SelectFilter name="client" label={t('filter.client')} value={filters.client} onChange={handleFilterChange} options={clientOptions} placeholder={t('filter.allClients')} />
                                <SelectFilter name="product" label={t('filter.product')} value={filters.product} onChange={handleFilterChange} options={productOptions} placeholder={t('filter.allProducts')} />
                                <SelectFilter name="orderStatus" label={t('filter.orderStatus')} value={filters.orderStatus} onChange={handleFilterChange} options={orderStatusOptions} placeholder={t('filter.allOrderStatuses')} />
                                <SelectFilter name="paymentStatus" label={t('filter.paymentStatus')} value={filters.paymentStatus} onChange={handleFilterChange} options={paymentStatusOptions} placeholder={t('filter.allPaymentStatuses')} />
                                <div className="md:col-span-2 lg:col-span-4">
                                    <PeriodFilter 
                                        period={filters.period} 
                                        onPeriodChange={e => setFilters(prev => ({ ...prev, period: e.target.value, startDate: '', endDate: '' }))} 
                                        startDate={filters.startDate} 
                                        onStartDateChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value, period: 'custom' }))} 
                                        endDate={filters.endDate} 
                                        onEndDateChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value, period: 'custom' }))}
                                    />
                                </div>
                                <div className="md:col-span-2 lg:col-span-4 flex justify-end items-center gap-2 mt-2">
                                    <button onClick={handleResetFilters} className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors h-10">{t('filter.reset')}</button>
                                    <button onClick={handleApplyFilters} className="px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors h-10">{t('filter.apply')}</button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3">{t('order.orderId')}</th>
                                        <th className="px-6 py-3">{t('order.customer')}</th>
                                        <th className="px-6 py-3">{t('order.date')}</th>
                                        <th className="px-6 py-3 text-right">{t('order.total')}</th>
                                        <th className="px-6 py-3 text-right">{t('order.amountPaid')}</th>
                                        <th className="px-6 py-3 text-right">{t('order.remainingBalance')}</th>
                                        <th className="px-6 py-3 text-center">{t('order.paymentStatus')}</th>
                                        <th className="px-6 py-3 text-center">{t('order.orderStatus')}</th>
                                        <th className="px-6 py-3 text-center">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const isPaymentLate = order.paymentStatus !== PaymentStatus.PAID && new Date(order.paymentDueDate) < today;
                                        const hasStatusIssue = order.status === OrderStatus.CANCELLED;
                                        const isPendingValidation = order.status === OrderStatus.PENDING_VALIDATION;

                                        return (
                                        <tr key={order.id} className={`bg-white border-b hover:bg-slate-50 transition-colors ${isPendingValidation ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                                            <td className="px-6 py-4 font-semibold">{order.id}</td>
                                            <td className="px-6 py-4">{order.customerName}</td>
                                            <td className="px-6 py-4">{order.date}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-bold">{formatCurrency(order.totalAmount)}</div>
                                                <div className="text-xs text-slate-500">{t('invoice.tax')} ({(order.taxRateValue * 100).toFixed(2)}%): {formatCurrency(order.taxAmount)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-green-600 font-medium">{formatCurrency(order.amountPaid)}</td>
                                            <td className="px-6 py-4 text-right text-red-600 font-medium">{formatCurrency(order.totalAmount - order.amountPaid)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusClass(order.paymentStatus)}`}>
                                                        {t(`order.paymentStatus_${order.paymentStatus}`)}
                                                    </span>
                                                    {isPaymentLate && (
                                                        <span title={t('sales.paymentOverdue')}>
                                                            <IconExclamationTriangle className="h-5 w-5 text-red-500" />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getOrderStatusClass(order.status)}`}>
                                                        {t(`order.status_${order.status}`)}
                                                    </span>
                                                    {hasStatusIssue && (
                                                        <span title={t('sales.statusIssue')}>
                                                             <IconExclamationTriangle className="h-5 w-5 text-orange-500" />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isPendingValidation ? (
                                                     <button onClick={() => onValidateForProduction(order.id)} className="flex items-center mx-auto space-x-2 px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-md hover:bg-green-600 transition-colors" title={t('sales.validateForProduction')}>
                                                        <IconCheckCircle className="h-5 w-5" />
                                                        <span>{t('sales.validateForProduction')}</span>
                                                     </button>
                                                ) : (
                                                    <div className="flex justify-center items-center space-x-1">
                                                        {order.paymentStatus !== PaymentStatus.PAID && <button onClick={() => setPayingOrder(order)} className="p-2 text-green-600 hover:bg-green-100 rounded-full" title={t('order.recordPayment')}><IconCoins className="h-5 w-5"/></button>}
                                                        <button onClick={() => setUpdatingStatusOrder(order)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full" title={t('order.updateStatus')}><IconEdit className="h-5 w-5"/></button>
                                                        <button onClick={() => setInvoiceOrder(order)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full" title={t('invoice.viewInvoice')}><IconInvoice className="h-5 w-5"/></button>
                                                        <button onClick={() => setBlOrder(order)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full" title={t('common.viewBL')}><IconDocumentText className="h-5 w-5"/></button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                             {filteredOrders.length === 0 && <p className="text-center py-8 text-slate-500">{t('filter.noResults')}</p>}
                        </div>
                    </div>
                )}
            </div>
             {/* Top Selling Products Section */}
            <div className="bg-white rounded-xl shadow-md">
                <button
                    onClick={() => setShowTopProducts(!showTopProducts)}
                    className="w-full p-4 text-left flex justify-between items-center"
                >
                    <h3 className="text-xl font-semibold text-slate-800">{t('sales.topSellingProducts.title')}</h3>
                    <IconChevronDown className={`h-6 w-6 transition-transform ${showTopProducts ? 'rotate-180' : ''}`} />
                </button>
                {showTopProducts && (
                    <div className="p-6 pt-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3">{t('sales.topSellingProducts.product')}</th>
                                        <th className="px-6 py-3 text-center">{t('sales.topSellingProducts.quantity')}</th>
                                        <th className="px-6 py-3 text-right">{t('sales.topSellingProducts.revenue')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topSellingProducts.map(p => (
                                        <tr key={p.name} className="bg-white border-b hover:bg-slate-50">
                                            <td className="px-6 py-4 font-semibold">{p.name}</td>
                                            <td className="px-6 py-4 text-center">{p.quantity}</td>
                                            <td className="px-6 py-4 text-right font-bold">{formatCurrency(p.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>


            {/* Modals */}
            {payingOrder && <RecordPaymentModal isOpen={!!payingOrder} onClose={() => setPayingOrder(null)} order={payingOrder} onRecordPayment={onRecordPayment} />}
            {updatingStatusOrder && <OrderStatusUpdateModal isOpen={!!updatingStatusOrder} onClose={() => setUpdatingStatusOrder(null)} order={updatingStatusOrder} onUpdateStatus={onUpdateOrderStatus} />}
            {invoiceOrder && clientForInvoice && <InvoiceModal isOpen={!!invoiceOrder} onClose={() => setInvoiceOrder(null)} order={invoiceOrder} subsidiary={subsidiary} client={clientForInvoice} />}
            {blOrder && <BonDeLivraison order={blOrder} subsidiary={subsidiary} onClose={() => setBlOrder(null)} />}
        </div>
    );
};

export default Sales;
