import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, Subsidiary, Product, Contact, User, UserRole, PaymentStatus } from '../types';
import { useI18n } from '../i18n';
import NewOrder from './NewOrder';
import BonDeLivraison from './BonDeLivraison';
import IconDocumentText from '../components/icons/IconDocumentText';
import SelectFilter from '../components/filters/SelectFilter';
import PeriodFilter from '../components/filters/PeriodFilter';

interface MesCommandesProps {
    subsidiary: Subsidiary;
    orders: Order[];
    products: Product[];
    contacts: Contact[];
    // FIX: Correct the type for onPlaceOrder to match the 'PLACE_ORDER' action payload.
    onPlaceOrder: (newOrder: Omit<Order, 'id' | 'subsidiaryId' | 'status' | 'salesRepId' | 'paymentStatus' | 'amountPaid' | 'productionStatus' | 'productionHistory' | 'taxRateId' | 'taxRateValue'>) => void;
    currentUser: User;
}

const MesCommandes: React.FC<MesCommandesProps> = ({ subsidiary, orders, products, contacts, onPlaceOrder, currentUser }) => {
    const { t, formatCurrency } = useI18n();
    const [activeTab, setActiveTab] = useState<'history' | 'new'>('history');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isBlModalOpen, setIsBlModalOpen] = useState(false);
    
    const [selectedProduct, setSelectedProduct] = useState('');
    const [period, setPeriod] = useState('all_time');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const currentCustomer = useMemo(() => {
        // FIX: Replaced check for non-existent UserRole.CLIENT. This component seems to be for
        // a dashboard user who is also a customer. Find the corresponding contact by matching the user's email.
        return contacts.find(c => c.email === currentUser.email);
    }, [contacts, currentUser]);
    
    const filteredClientOrders = useMemo(() => {
        if (!currentCustomer) return [];
        
        let clientOrders = orders.filter(order => order.customerId === currentCustomer.id && order.subsidiaryId === subsidiary.id);

        if (selectedProduct) {
            clientOrders = clientOrders.filter(o => o.items.some(item => item.product.id === selectedProduct));
        }
        
        if (period !== 'all_time') {
            const now = new Date();
            let startPeriodDate = new Date();
            let endPeriodDate = new Date(now);

            if (period === 'custom' && startDate && endDate) {
                startPeriodDate = new Date(startDate);
                endPeriodDate = new Date(endDate);
                endPeriodDate.setHours(23, 59, 59, 999);
            } else {
                startPeriodDate.setHours(0, 0, 0, 0);
                switch (period) {
                    case 'seven_days': startPeriodDate.setDate(now.getDate() - 6); break;
                    case 'thirty_days': startPeriodDate.setDate(now.getDate() - 29); break;
                    case 'ninety_days': startPeriodDate.setDate(now.getDate() - 89); break;
                    case 'year': startPeriodDate = new Date(now.getFullYear(), 0, 1); break;
                }
            }
            
            clientOrders = clientOrders.filter(o => {
                const orderDate = new Date(o.date);
                return orderDate >= startPeriodDate && orderDate <= endPeriodDate;
            });
        }
        
        return clientOrders;
    }, [orders, currentCustomer, subsidiary.id, selectedProduct, period, startDate, endDate]);

    const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPeriod = e.target.value;
        setPeriod(newPeriod);
        if (newPeriod !== 'custom') {
            setStartDate('');
            setEndDate('');
        }
    };

    const handleResetFilters = () => {
        setSelectedProduct('');
        setPeriod('all_time');
        setStartDate('');
        setEndDate('');
    };

    const productOptions = products
        .filter(p => p.subsidiaryId === subsidiary.id)
        .map(p => ({ value: p.id, label: p.name }));

    // FIX: Correct the type for newOrderData to match the onPlaceOrder prop.
    const handlePlaceOrder = (newOrderData: Omit<Order, 'id' | 'subsidiaryId' | 'status' | 'salesRepId' | 'paymentStatus' | 'amountPaid' | 'productionStatus' | 'productionHistory' | 'taxRateId' | 'taxRateValue'>) => {
        onPlaceOrder(newOrderData);
        setActiveTab('history');
    };

    const handleViewBL = (order: Order) => {
        setSelectedOrder(order);
        setIsBlModalOpen(true);
    };

    const getStatusClass = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.COMPLETED:
            case OrderStatus.DELIVERED:
                return 'bg-green-100 text-green-800';
            case OrderStatus.PENDING_DELIVERY: return 'bg-yellow-100 text-yellow-800';
            case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    }

    const getTranslatedStatus = (status: OrderStatus) => {
        return t(`order.status_${status}`);
    }

    const TabButton: React.FC<{ view: 'history' | 'new'; label: string }> = ({ view, label }) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c6e911] ${
                activeTab === view
                    ? 'bg-[#c6e911] text-slate-800 shadow'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">{t('myOrders.title')}</h2>
                <div className="flex items-center space-x-2 p-1 bg-slate-200 rounded-lg self-start sm:self-center">
                    <TabButton view="history" label={t('myOrders.historyTab')} />
                    <TabButton view="new" label={t('myOrders.newOrderTab')} />
                </div>
            </div>

            {activeTab === 'history' && (
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 space-y-4">
                     <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex flex-wrap gap-4 items-end">
                            <SelectFilter
                                name="product"
                                label={t('filter.product')}
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                options={productOptions}
                                placeholder={t('filter.allProducts')}
                            />
                            <PeriodFilter 
                                period={period}
                                onPeriodChange={handlePeriodChange}
                                startDate={startDate}
                                onStartDateChange={e => setStartDate(e.target.value)}
                                endDate={endDate}
                                onEndDateChange={e => setEndDate(e.target.value)}
                            />
                            <button
                                onClick={handleResetFilters}
                                className="justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-slate-700 bg-slate-200 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                            >
                                {t('filter.reset')}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{t('order.orderId')}</th>
                                    <th scope="col" className="px-6 py-3">{t('order.date')}</th>
                                    <th scope="col" className="px-6 py-3">{t('order.total')}</th>
                                    <th scope="col" className="px-6 py-3">{t('order.status')}</th>
                                    <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClientOrders.length > 0 ? (
                                    filteredClientOrders.map((order) => (
                                        <tr key={order.id} className="bg-white border-b hover:bg-slate-50">
                                            <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{order.id}</th>
                                            <td className="px-6 py-4">{order.date}</td>
                                            <td className="px-6 py-4 font-semibold">{formatCurrency(order.totalAmount)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(order.status)}`}>
                                                    {getTranslatedStatus(order.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => handleViewBL(order)}
                                                    className="flex items-center mx-auto space-x-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-200 transition-colors"
                                                    aria-label={t('common.viewBL')}
                                                >
                                                    <IconDocumentText className="h-4 w-4" />
                                                    <span>{t('common.viewBL')}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-slate-500">{t('myOrders.noOrders')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {activeTab === 'new' && currentCustomer && <NewOrder subsidiary={subsidiary} products={products} currentCustomer={currentCustomer} onOrderPlaced={handlePlaceOrder} />}

            {isBlModalOpen && selectedOrder && (
                <BonDeLivraison 
                    order={selectedOrder} 
                    subsidiary={subsidiary}
                    onClose={() => setIsBlModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default MesCommandes;
