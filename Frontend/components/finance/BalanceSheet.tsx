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

    const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
        queryKey: ['orders', 'unpaid'],
        queryFn: () =>
            getOrders({ paymentStatus: PaymentStatus.UNPAID }).then(o1 =>
                getOrders({ paymentStatus: PaymentStatus.PARTIALLY_PAID }).then(o2 => [...o1, ...o2])
            ),
    });

    const { data: clients = {} } = useQuery<Record<string, Contact>>({
        queryKey: ['clients'],
        queryFn: async () => {
            const ids = [...new Set(orders.map(o => o.customerId))];
            const result: Record<string, Contact> = {};
            await Promise.all(
                ids.map(async id => {
                    try { result[id] = await getContactById(id); } catch { /* contact introuvable */ }
                })
            );
            return result;
        },
        enabled: orders.length > 0,
    });

    const realCustomerReceivables = React.useMemo(
        () => orders.reduce((total, o) => {
            const remaining = o.totalAmount - o.amountPaid;
            return total + (remaining > 0 ? remaining : 0);
        }, 0),
        [orders],
    );

    const { data: apiReceivablesData = { totalReceivables: 0 } } = useQuery<CustomerReceivablesStats>({
        queryKey: ['totalReceivables'],
        queryFn: () => getCustomerReceivables({ period: 'all_time' }),
    });

    const adjustedTotalAssets = React.useMemo(() => {
        if (!balanceSheetData) return 0;
        return balanceSheetData.totalAssets - balanceSheetData.assets.customerReceivables + realCustomerReceivables;
    }, [balanceSheetData, realCustomerReceivables]);

    if (!balanceSheetData) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse">
                <div className="h-7 bg-slate-100 rounded-lg mb-6 w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[0, 1].map(col => (
                        <div key={col} className="space-y-3">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-5 bg-slate-100 rounded-lg" />)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const totalLiabilitiesAndEquity = balanceSheetData.totalLiabilities + balanceSheetData.totalEquity;
    const isBalanced = Math.abs(adjustedTotalAssets - totalLiabilitiesAndEquity) < 1;

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

            {/* En-tête */}
            <div className="bg-gradient-to-r from-[#c6e911] to-[#adc40f] px-6 py-4">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{t('finance.bilan.title')}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                            <span className="text-sm text-slate-700 font-medium">{subsidiary.name}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs text-slate-700 font-medium">Total Actifs</p>
                            <p className="text-lg font-bold text-slate-800">
                                {formatCurrency(adjustedTotalAssets)}
                                {isLoadingOrders && <span className="ml-2 text-xs text-slate-600">⏳</span>}
                            </p>
                        </div>
                        <div className="w-px h-8 bg-slate-700/30" />
                        <div className="text-right">
                            <p className="text-xs text-slate-700 font-medium">Total Passifs</p>
                            <p className="text-lg font-bold text-slate-800">{formatCurrency(totalLiabilitiesAndEquity)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Corps */}
            <div className="p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Actifs */}
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                            <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                                <span className="w-2 h-5 bg-[#c6e911] rounded-full inline-block" />
                                {t('finance.bilan.assets')}
                            </h3>

                            <div className="space-y-3">
                                {/* Actifs courants */}
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('finance.bilan.currentAssets')}</p>
                                    <div className="space-y-2">
                                        {[
                                            { label: t('finance.bilan.cash'),              value: balanceSheetData.assets.treasury },
                                            { label: t('finance.bilan.accountsReceivable'), value: realCustomerReceivables },
                                            { label: t('finance.bilan.inventory'),          value: balanceSheetData.assets.inventory },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                                                <span className="text-sm text-slate-600">{label}</span>
                                                <span className="text-sm font-semibold text-slate-700">{formatCurrency(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actifs immobilisés */}
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('finance.bilan.fixedAssets')}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">{t('finance.bilan.equipment')}</span>
                                        <span className="text-sm font-semibold text-slate-700">{formatCurrency(balanceSheetData.assets.equipments)}</span>
                                    </div>
                                </div>

                                {/* Total actifs */}
                                <div className="bg-slate-800 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-white text-sm">{t('finance.bilan.totalAssets')}</p>
                                            <p className="text-slate-400 text-xs mt-0.5">Somme de tous les actifs</p>
                                        </div>
                                        <span className="text-xl font-bold text-[#c6e911]">
                                            {formatCurrency(adjustedTotalAssets)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Passifs & Capitaux propres */}
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                            <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                                <span className="w-2 h-5 bg-red-400 rounded-full inline-block" />
                                {t('finance.bilan.liabilitiesAndEquity')}
                            </h3>

                            <div className="space-y-3">
                                {/* Dettes */}
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('finance.bilan.liabilities')}</p>
                                    <div className="space-y-2">
                                        {[
                                            { label: t('finance.bilan.accountsPayable'), value: balanceSheetData.liabilities.supplierDebts },
                                            { label: t('finance.bilan.longTermDebts'),   value: balanceSheetData.liabilities.longTermDebts },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                                                <span className="text-sm text-slate-600">{label}</span>
                                                <span className="text-sm font-semibold text-red-600">{formatCurrency(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Capitaux propres */}
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('finance.bilan.equity')}</p>
                                    <div className="space-y-2">
                                        {[
                                            { label: t('finance.bilan.shareCapital'),     value: balanceSheetData.equity.shareCapital },
                                            { label: t('finance.bilan.retainedEarnings'), value: balanceSheetData.equity.retainedEarnings },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                                                <span className="text-sm text-slate-600">{label}</span>
                                                <span className="text-sm font-semibold text-slate-700">{formatCurrency(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total passifs */}
                                <div className="bg-slate-800 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-white text-sm">{t('finance.bilan.totalLiabilitiesAndEquity')}</p>
                                            <p className="text-slate-400 text-xs mt-0.5">Dettes + capitaux propres</p>
                                        </div>
                                        <span className="text-xl font-bold text-[#c6e911]">
                                            {formatCurrency(totalLiabilitiesAndEquity)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vérification équilibre */}
                    <div className={`mt-6 rounded-xl p-5 border-2 flex items-center justify-between ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isBalanced ? 'bg-green-100' : 'bg-amber-100'}`}>
                                {isBalanced ? (
                                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800 text-sm">
                                    {isBalanced ? 'Bilan équilibré' : 'Bilan non équilibré'}
                                </p>
                                <p className="text-xs text-slate-500">Actif = Passif + Capitaux propres</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 mb-0.5">Écart</p>
                            <p className={`text-lg font-bold ${isBalanced ? 'text-green-600' : 'text-amber-600'}`}>
                                {formatCurrency(adjustedTotalAssets - balanceSheetData.totalLiabilities)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BalanceSheet;
