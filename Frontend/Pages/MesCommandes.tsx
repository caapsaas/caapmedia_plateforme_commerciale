import React, { useState, useMemo, useEffect } from 'react';
import { Order, OrderStatus, Product, Contact } from '../types';
import { useI18n } from '../i18n';
import NewOrder from './NewOrder';
import BonDeLivraison from './BonDeLivraison';
import IconDocumentText from '../components/icons/IconDocumentText';
import SelectFilter from '../components/filters/SelectFilter';
import PeriodFilter from '../components/filters/PeriodFilter';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, createOrderBySalesRep, createOrderBySalesRepJson, FindAllOrdersDto } from '../services/apiE-commerce/apiOrders';
import { getServicesCatalog } from '../services/apiE-commerce/apiProducts';
import { getContacts } from '../services/apiCrm/apicontacts';

const MesCommandes: React.FC = () => {
    const { t, formatCurrency } = useI18n();
    const { user: currentUser, subsidiary } = useAuth();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<'history' | 'new'>('history');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isBlModalOpen, setIsBlModalOpen] = useState(false);
    const [filters, setFilters] = useState<FindAllOrdersDto>({ period: 'all_time' });
    
    // --- TanStack Query Data Fetching ---
    const { data: contacts = [] } = useQuery<Contact[]>({
        queryKey: ['contacts', subsidiary?.id],
        queryFn: getContacts,
        enabled: !!subsidiary,
    });

    const currentCustomer = useMemo(() => {
        if (!currentUser) return null;
        return contacts.find(c => c.email === currentUser.email) || null;
    }, [contacts, currentUser]);

    // Mettre à jour les filtres avec l'ID du client une fois qu'il est connu
    useEffect(() => {
        if (currentCustomer) {
            setFilters(prev => ({ ...prev, customerId: currentCustomer.id }));
        }
    }, [currentCustomer]);

    const { data: filteredClientOrders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
        queryKey: ['customerOrders', filters],
        queryFn: () => getOrders(filters),
        enabled: !!filters.customerId, // La requête ne se lance que si nous avons un ID client
    });

    const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
        queryKey: ['services-catalog'],
        queryFn: getServicesCatalog,
        enabled: !!subsidiary,
    });

    const { mutate: placeOrderMutation } = useMutation({
        mutationFn: createOrderBySalesRepJson,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customerOrders', currentCustomer?.id] });
            setActiveTab('history');
        },
    });

    if (!subsidiary || !currentUser) {
        return <div>Chargement ou erreur d'authentification...</div>;
    }
    
    const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPeriod = e.target.value;
        setFilters(prev => ({
            ...prev,
            period: newPeriod as FindAllOrdersDto['period'],
            startDate: '',
            endDate: ''
        }));
    };

    const handleResetFilters = () => {
        setFilters({ customerId: currentCustomer?.id, period: 'all_time' });
    };

    const productOptions = products.map(p => ({ value: p.id, label: p.name }));

    const handlePlaceOrder = (newOrderData: Omit<Order, 'id' | 'subsidiaryId'>) => {
        // Préparer les données selon la structure attendue par CreateOrderBySalesRepDto
        const orderPayload = {
            customerId: newOrderData.customerId,
            customerName: newOrderData.customerName,
            paymentDueDate: newOrderData.paymentDueDate,
            paymentMethod: newOrderData.paymentMethod || 'PAY_ON_DELIVERY',
            source: 'MANUAL',
            items: newOrderData.items.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                options: item.options ? Object.entries(item.options).map(([key, value]) => ({
                    optionType: key,
                    optionValue: value
                })) : [],
                specValues: item.specValues,
            })),
            opportunityId: newOrderData.opportunityId || undefined
        };
        
        // Debug: Afficher les données dans la console
        console.log('Données envoyées au backend:');
        console.log('Payload:', JSON.stringify(orderPayload, null, 2));

        placeOrderMutation(orderPayload);
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

    if (isLoadingOrders || isLoadingProducts) {
        return <div>{t('common.loading')}</div>;
    }

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
                                value={filters.productId || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, productId: e.target.value }))}
                                options={productOptions}
                                placeholder={t('filter.allProducts')}
                            />
                            
                            <PeriodFilter 
                                period={filters.period || 'all_time'}
                                onPeriodChange={handlePeriodChange}
                                startDate={filters.startDate || ''}
                                onStartDateChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value, period: 'custom' }))}
                                endDate={filters.endDate || ''}
                                onEndDateChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value, period: 'custom' }))}
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
            {activeTab === 'new' && currentCustomer && (
                <NewOrder 
                    subsidiary={subsidiary} 
                    products={products} 
                    onOrderPlaced={handlePlaceOrder}
                    selectedCustomer={currentCustomer}
                />
            )}

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