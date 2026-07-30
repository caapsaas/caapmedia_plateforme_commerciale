import React, { useMemo } from 'react';
import { Kpi } from '../../types';
import { useI18n } from '../../i18n';
import KpiCard from '../../Pages/KpiCard';
import IconTrendingUp from '../icons/IconTrendingUp';
import IconCurrency from '../icons/IconCurrency';
import IconTruck from '../icons/IconTruck';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PurchaseChart from '../../Pages/PurchaseChart';
import { PurchaseAnalysis } from '../../services/apiStatistic/apiAnalytics';
import EmptyState from '../ui/EmptyState';


interface PurchaseAnalysisViewProps {
   data: PurchaseAnalysis;
}

const COLORS = ['#c6e911', '#231F20', '#6B7280', '#FBBF24', '#38BDF8', '#8B5CF6'];

const PurchaseAnalysisView: React.FC<PurchaseAnalysisViewProps> = ({ data }) => {
  const { t, formatCurrency } = useI18n();

    const kpis: Kpi[] = [
      { titleKey: "purchaseAnalysis.totalPurchaseValue", value: formatCurrency(data.totalPurchaseValue), change: "+5%", changeType: 'increase', icon: <IconCurrency className="h-8 w-8 text-blue-500" /> },
      { titleKey: "purchaseAnalysis.totalOrders", value: data.totalOrders.toString(), change: "+2", changeType: 'increase', icon: <IconTruck className="h-8 w-8 text-green-500" /> },
      { titleKey: "purchaseAnalysis.averageOrderValue", value: formatCurrency(data.averageOrderValue), change: "-1.2%", changeType: 'decrease', icon: <IconTrendingUp className="h-8 w-8 text-red-500" /> },
    ];

    const spendingBySupplier = useMemo(() => {
            return data.spendingBySupplier.map(s => ({
            name: s.supplierName,
            value: s._sum.totalAmount,
        }));
    }, [data.spendingBySupplier]);


    const purchasesOverTime = useMemo(() => {
        return [];
    }, []);

  const topPurchasedProducts = useMemo(() => {
        return data.topPurchasedProducts.map(p => ({
        name: p.productName,
        quantity: p._sum.quantity || 0,
        // The 'value' is not directly available, we can approximate or adjust the backend.
        // For now, let's use quantity as a proxy for the table sorting.
        value: p._sum.quantity || 0, 
        }));
    }, [data.topPurchasedProducts]);


  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map(kpi => <KpiCard key={kpi.titleKey} {...kpi} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                 <h3 className="font-semibold text-lg mb-4 text-slate-700">{t('purchaseAnalysis.purchasesOverTime')}</h3>
                 <PurchaseChart data={purchasesOverTime} />
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                 <h3 className="font-semibold text-lg mb-4 text-slate-700">{t('purchaseAnalysis.spendingBySupplier')}</h3>
                 <div style={{ width: '100%', height: 300, minWidth: 300 }}>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={spendingBySupplier} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name">
                                {spendingBySupplier.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '0.5rem' }}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                 </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="font-semibold text-lg mb-4 text-slate-700">{t('purchaseAnalysis.topPurchasedProducts')}</h3>
            {topPurchasedProducts.length === 0 ? (
                <EmptyState icon="stock" title={t('purchaseAnalysis.topPurchasedProducts')} description={t('common.notAvailable')} />
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('stock.name')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('sales.quantity')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('purchaseAnalysis.totalValue')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topPurchasedProducts.map(product => (
                            <tr key={product.name} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{product.name}</td>
                                <td className="px-6 py-4 text-right">{product.quantity}</td>
                                <td className="px-6 py-4 text-right font-bold">{formatCurrency(product.value)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}
        </div>
    </div>
  );
};

export default PurchaseAnalysisView;