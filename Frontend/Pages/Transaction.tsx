import React, { useState, useMemo } from 'react';
import { Sale, CustomerPaymentMethod, Contact, Product } from '../types';
import { useI18n } from '../i18n';
import SelectFilter from '../components/filters/SelectFilter';
import PeriodFilter from '../components/filters/PeriodFilter';
import { useAppContext } from '../context/AppContext';
import IconEye from '../components/icons/IconEye';
import IconCoins from '../components/icons/IconCoins';
import IconCheckCircle from '../components/icons/IconCheckCircle';
import IconExclamationTriangle from '../components/icons/IconExclamationTriangle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSales, FindAllSalesDto } from '../services/apiE-commerce/apiSales';
import { getProducts } from '../services/apiE-commerce/apiProducts';
import { getContacts } from '../services/apiCrm/apiContacts';

const Transaction: React.FC = () => {
    const { t, formatCurrency } = useI18n();
    const { state } = useAppContext();
    const { currentSubsidiary: subsidiary, currentUser } = state;
    const queryClient = useQueryClient();

    const [filters, setFilters] = useState<FindAllSalesDto>({ period: 'ALL_TIME' });
    
    // --- TanStack Query Data Fetching ---
    const { data: contacts = [] } = useQuery<Contact[]>({
        queryKey: ['contacts', subsidiary?.id],
        queryFn: getContacts,
        enabled: !!subsidiary,
    });

    const { data: sales = [], isLoading: isLoadingSales } = useQuery<Sale[]>({
        queryKey: ['sales', subsidiary?.id, filters],
        queryFn: () => getSales(filters),
        enabled: !!subsidiary,
    });

    const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
        queryKey: ['products', subsidiary?.id],
        queryFn: getProducts,
        enabled: !!subsidiary,
    });

    if (!subsidiary || !currentUser) {
        return <div>Chargement ou erreur d'authentification...</div>;
    }
    
    if (isLoadingSales || isLoadingProducts) {
        return <div>{t('common.loading')}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">{t('myOrders.title')}</h2>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 space-y-4">
                 <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex flex-wrap gap-4 items-end">
                        {/* Mettez ici vos filtres pour les ventes si nécessaire, en utilisant setFilters */}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('sales.saleId')}</th>
                                <th scope="col" className="px-6 py-3">{t('sales.customer')}</th>
                                <th scope="col" className="px-6 py-3">{t('sales.product')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('sales.quantity')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('sales.totalPrice')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('sales.status')}</th>
                                <th scope="col" className="px-6 py-3">{t('sales.date')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length > 0 ? (
                                sales.map((sale) => (
                                    <tr key={sale.id} className="bg-white border-b hover:bg-slate-50">
                                        <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{sale.id}</th>
                                        <td className="px-6 py-4">{sale.customerName}</td>
                                        <td className="px-6 py-4">{sale.productName}</td>
                                        <td className="px-6 py-4 text-center">{sale.quantity}</td>
                                        <td className="px-6 py-4 text-right font-semibold">{formatCurrency(sale.totalPrice)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                sale.status === 'Payé' ? 'bg-green-100 text-green-800' : 
                                                sale.status === 'En attente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {t(`sales.status${sale.status}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{new Date(sale.date).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-slate-500">{t('filter.noResults')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Transaction;