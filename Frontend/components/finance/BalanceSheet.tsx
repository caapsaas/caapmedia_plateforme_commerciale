import React from 'react';
import { Subsidiary, Order, Contact, PaymentStatus } from '../../types';
import { BalanceSheet as BalanceSheetType, getCustomerReceivables, CustomerReceivablesStats } from '../../services/apiStatistic/apiFinanceStats';
import { useI18n } from '../../i18n';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../../services/apiE-commerce/apiOrders';
import { getContactById } from '../../services/apiCrm/apicontacts';

interface BalanceSheetProps {
    subsidiary: Subsidiary;
    balanceSheetData?: BalanceSheetType;
}

const BalanceSheet: React.FC<BalanceSheetProps> = ({ subsidiary, balanceSheetData }) => {
    const { t, formatCurrency } = useI18n();

    // Get real customer receivables data from orders
    const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({ 
        queryKey: ['orders', 'unpaid'], 
        queryFn: () => getOrders({
            paymentStatus: PaymentStatus.UNPAID
        }).then(orders1 => 
            getOrders({
                paymentStatus: PaymentStatus.PARTIALLY_PAID
            }).then(orders2 => [...orders1, ...orders2])
        )
    });

    // Get client information for company names
    const { data: clients = {} } = useQuery<Record<string, Contact>>({
        queryKey: ['clients'],
        queryFn: async () => {
            const uniqueCustomerIds = [...new Set(orders.map(order => order.customerId))];
            const clientsData: Record<string, Contact> = {};
            
            await Promise.all(
                uniqueCustomerIds.map(async (customerId) => {
                    try {
                        const client = await getContactById(customerId);
                        clientsData[customerId] = client;
                    } catch (error) {
                        console.warn(`Impossible de récupérer le client ${customerId}:`, error);
                    }
                })
            );
            
            return clientsData;
        },
        enabled: orders.length > 0
    });

    // Calculate real customer receivables from orders
    const realCustomerReceivables = React.useMemo(() => {
        if (!orders.length) return 0;
        
        return orders.reduce((total, order) => {
            const remainingBalance = order.totalAmount - order.amountPaid;
            return total + (remainingBalance > 0 ? remainingBalance : 0);
        }, 0);
    }, [orders]);

    // Get API customer receivables stats for comparison
    const { data: apiReceivablesData = { totalReceivables: 0 } } = useQuery<CustomerReceivablesStats>({
        queryKey: ['totalReceivables'],
        queryFn: () => getCustomerReceivables({
            period: 'all_time',
        })
    });

    // Calculate adjusted total assets with real customer receivables
    const adjustedTotalAssets = React.useMemo(() => {
        if (!balanceSheetData) return 0;
        const otherAssets = balanceSheetData.totalAssets - balanceSheetData.assets.customerReceivables;
        return otherAssets + realCustomerReceivables;
    }, [balanceSheetData, realCustomerReceivables]);
    
    // Loading state with modern skeleton
    if (!balanceSheetData) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded-lg mb-6 w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-6 bg-gray-200 rounded-lg"></div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-6 bg-gray-200 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const DataRow: React.FC<{ label: string; value: number; isTotal?: boolean; indent?: boolean }> = ({ label, value, isTotal, indent }) => (
        <div className={`flex justify-between items-center py-3 ${isTotal ? 'font-bold border-t-2 border-slate-300 pt-4 mt-2' : ''} ${indent ? 'pl-4' : ''}`}>
            <span className={`${isTotal ? 'text-slate-900 text-base' : 'text-slate-700 text-sm'}`}>{label}</span>
            <span className={`${isTotal ? 'text-slate-900 text-base font-bold' : 'text-slate-600 text-sm font-medium'}`}>
                {formatCurrency(value)}
            </span>
        </div>
    );
    
    const HeaderRow: React.FC<{ title: string; }> = ({ title }) => (
        <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
            </div>
            <h4 className="font-bold text-lg text-slate-800">{title}</h4>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            {/* Header with application colors */}
            <div className="bg-gradient-to-r from-[#c6e911] to-[#adc40f] p-4 text-white">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3">
                    <div>
                        <h2 className="text-xl font-bold mb-1 text-slate-800">{t('finance.bilan.title')}</h2>
                        <div className="flex items-center gap-2 text-slate-700">
                            <div className="w-1.5 h-1.5 bg-[#c6e911] rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">{subsidiary.name}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-700">
                        <div className="text-right">
                            <div className="text-xs text-slate-600 font-medium">Total Assets</div>
                            <div className="text-lg font-bold text-slate-800">
                                {formatCurrency(adjustedTotalAssets)}
                                {isLoadingOrders && <span className="ml-2 text-xs text-yellow-600">⏳</span>}
                            </div>
                        </div>
                        <div className="w-px h-8 bg-slate-300"></div>
                        <div className="text-right">
                            <div className="text-xs text-slate-600 font-medium">Total Liabilities</div>
                            <div className="text-lg font-bold text-slate-800">{formatCurrency(balanceSheetData.totalLiabilities)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
                {/* Assets Column */}
                        <div className="bg-gradient-to-br from-slate-50 to-[#c6e911]/10 rounded-xl p-6 border border-[#c6e911]/20">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-[#c6e911] rounded-lg flex items-center justify-center">
                                    <div className="w-4 h-4 bg-white rounded"></div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">{t('finance.bilan.assets')}</h3>
                            </div>

                            <div className="space-y-6">
                                {/* Current Assets Section */}
                                <div className="bg-white rounded-lg p-4 border border-[#c6e911]/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-5 h-5 bg-[#c6e911]/20 rounded-md flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-[#c6e911] rounded"></div>
                                        </div>
                                        <h4 className="font-semibold text-slate-700 text-sm">{t('finance.bilan.currentAssets')}</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center py-2 pl-4">
                                            <span className="text-slate-600 text-sm">{t('finance.bilan.cash')}</span>
                                            <span className="text-slate-700 text-sm font-medium">{formatCurrency(balanceSheetData.assets.treasury)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 pl-4">
                                            <span className="text-slate-600 text-sm">{t('finance.bilan.accountsReceivable')}</span>
                                            <span className="text-slate-700 text-sm font-medium">{formatCurrency(realCustomerReceivables)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 pl-4">
                                            <span className="text-slate-600 text-sm">{t('finance.bilan.inventory')}</span>
                                            <span className="text-slate-700 text-sm font-medium">{formatCurrency(balanceSheetData.assets.inventory)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Fixed Assets Section */}
                                <div className="bg-white rounded-lg p-4 border border-[#c6e911]/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-5 h-5 bg-[#adc40f]/20 rounded-md flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-[#adc40f] rounded"></div>
                                        </div>
                                        <h4 className="font-semibold text-slate-700 text-sm">{t('finance.bilan.fixedAssets')}</h4>
                                    </div>
                                    <div className="flex justify-between items-center py-2 pl-4">
                                        <span className="text-slate-600 text-sm">{t('finance.bilan.equipment')}</span>
                                        <span className="text-slate-700 text-sm font-medium">{formatCurrency(balanceSheetData.assets.equipments)}</span>
                                    </div>
                                </div>

                                {/* Total Assets */}
                                <div className="bg-gradient-to-r from-[#c6e911] to-[#adc40f] text-white rounded-lg p-4 shadow-md">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-white mb-1">{t('finance.bilan.totalAssets')}</h4>
                                            <p className="text-white/90 text-xs">Sum of all assets</p>
                                        </div>
                                        <div className="text-xl font-bold">
                                            {formatCurrency(adjustedTotalAssets)}
                                            {isLoadingOrders && <span className="ml-2 text-xs text-yellow-600">⏳</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Liabilities & Equity Column */}
                        <div className="bg-gradient-to-br from-slate-50 to-[#adc40f]/10 rounded-xl p-6 border border-[#adc40f]/20">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-[#adc40f] rounded-lg flex items-center justify-center">
                                    <div className="w-4 h-4 bg-white rounded"></div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">{t('finance.bilan.liabilitiesAndEquity')}</h3>
                            </div>

                            <div className="space-y-6">
                                {/* Liabilities Section */}
                                <div className="bg-white rounded-lg p-4 border border-[#adc40f]/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-5 h-5 bg-red-100 rounded-md flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-red-500 rounded"></div>
                                        </div>
                                        <h4 className="font-semibold text-slate-700 text-sm">{t('finance.bilan.liabilities')}</h4>
                                    </div>
                                    <div className="flex justify-between items-center py-2 pl-4">
                                        <span className="text-slate-600 text-sm">{t('finance.bilan.accountsPayable')}</span>
                                        <span className="text-slate-700 text-sm font-medium">{formatCurrency(balanceSheetData.liabilities.supplierDebts)}</span>
                                    </div>
                                </div>

                                {/* Equity Section */}
                                <div className="bg-white rounded-lg p-4 border border-[#adc40f]/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-5 h-5 bg-slate-100 rounded-md flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-slate-500 rounded"></div>
                                        </div>
                                        <h4 className="font-semibold text-slate-700 text-sm">{t('finance.bilan.equity')}</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center py-2 pl-4">
                                            <span className="text-slate-600 text-sm">{t('finance.bilan.shareCapital')}</span>
                                            <span className="text-slate-700 text-sm font-medium">{formatCurrency(balanceSheetData.liabilities.shareCapital)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 pl-4">
                                            <span className="text-slate-600 text-sm">{t('finance.bilan.netIncome')}</span>
                                            <span className="text-slate-700 text-sm font-medium">{formatCurrency(balanceSheetData.liabilities.netIncome)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Liabilities & Equity */}
                                <div className="bg-gradient-to-r from-[#adc40f] to-[#96900c] text-white rounded-lg p-4 shadow-md">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-white mb-1">{t('finance.bilan.totalLiabilitiesAndEquity')}</h4>
                                            <p className="text-white/90 text-xs">Sum of liabilities & equity</p>
                                        </div>
                                        <div className="text-xl font-bold">{formatCurrency(balanceSheetData.totalLiabilities)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Balance Verification */}
                    <div className="mt-8 bg-gradient-to-r from-[#c6e911]/10 to-[#adc40f]/10 rounded-xl p-6 border border-[#c6e911]/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    adjustedTotalAssets === balanceSheetData.totalLiabilities 
                                        ? 'bg-[#c6e911]' 
                                        : 'bg-yellow-500'
                                }`}>
                                    <div className="w-5 h-5 bg-white rounded-full"></div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Balance Verification</h4>
                                    <p className="text-slate-600 text-sm">
                                        Assets = Liabilities + Equity
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-600 mb-1 font-medium">Difference</div>
                                <div className={`text-lg font-bold ${
                                    adjustedTotalAssets === balanceSheetData.totalLiabilities 
                                        ? 'text-[#c6e911]' 
                                        : 'text-yellow-600'
                                }`}>
                                    {formatCurrency(adjustedTotalAssets - balanceSheetData.totalLiabilities)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BalanceSheet;
