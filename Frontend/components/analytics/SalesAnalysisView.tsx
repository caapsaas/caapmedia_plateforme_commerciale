import React, { useMemo } from 'react';
import { Kpi, StockChartData } from '../../types';
import { useI18n } from '../../i18n';
import { categoryToKeyMap } from '../../constants';
import KpiCard from '../../Pages/KpiCard';
import StockChart from '../../Pages/StockChart';
import IconTrendingUp from '../icons/IconTrendingUp';
import IconCurrency from '../icons/IconCurrency';
import IconUsers from '../icons/IconUsers';
import IconSales from '../icons/IconSales';
import { SalesAnalysis } from '../../services/apiStatistic/apiAnalytics';

interface SalesAnalysisViewProps {
    data: SalesAnalysis;
}

const SalesAnalysisView: React.FC<SalesAnalysisViewProps> = ({ data }) => {
  const { t, formatCurrency, formatNumber } = useI18n();


  const kpis = useMemo((): Kpi[] => {    
    return [
        { titleKey: 'salesAnalysis.totalRevenue', value: formatCurrency(data.totalRevenue), change: '+12%', changeType: 'increase', icon: <IconCurrency className="h-8 w-8 text-blue-500" /> },
        { titleKey: 'salesAnalysis.orderCount', value: formatNumber(data.orderCount), change: '+5', changeType: 'increase', icon: <IconSales className="h-8 w-8 text-green-500" /> },
        { titleKey: 'salesAnalysis.cashSaleCount', value: formatNumber(data.cashSaleCount), change: '+30', changeType: 'increase', icon: <IconTrendingUp className="h-8 w-8 text-indigo-500" /> },
        { titleKey: 'salesAnalysis.averageBasket', value: formatCurrency(data.averageBasket), change: '-2.5%', changeType: 'decrease', icon: <IconUsers className="h-8 w-8 text-red-500" /> },
    ];
  }, [data, formatCurrency, formatNumber]);

  const topProducts = useMemo(() => {
    return data.topSellingProducts.map(p => ({
      name: p.productName,
      quantity: p._sum.quantity || 0,
      revenue: p._sum.totalPrice || 0,
    }));
  }, [data.topSellingProducts]);
  
  const salesByCategory = useMemo((): StockChartData[] => {
    return data.salesByCategory.map(item => ({
        key: item.category,
        value: item.total,
        nameKey: categoryToKeyMap[item.category] || item.category,
    }));
  }, [data.salesByCategory]);
  
  const topCustomers = useMemo(() => {
    return data.topCustomers.map(c => ({
      name: c.customerName,
      totalSpent: c.totalSpent,
    }));
  }, [data.topCustomers]);

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map(kpi => <KpiCard key={kpi.titleKey} {...kpi} />)}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                 <h3 className="font-semibold text-lg mb-4 text-slate-700">{t('salesAnalysis.topProducts')}</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('salesAnalysis.product')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('salesAnalysis.quantity')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('salesAnalysis.revenue')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.map(product => (
                                <tr key={product.name} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-semibold">{product.name}</td>
                                    <td className="px-6 py-4 text-right">{product.quantity}</td>
                                    <td className="px-6 py-4 text-right font-bold">{formatCurrency(product.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                 <h3 className="font-semibold text-lg mb-4 text-slate-700">{t('salesAnalysis.salesByCategory')}</h3>
                 <StockChart data={salesByCategory} />
            </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="font-semibold text-lg mb-4 text-slate-700">{t('salesAnalysis.topCustomers')}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('salesAnalysis.customer')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('salesAnalysis.totalSpent')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topCustomers.map(customer => (
                            <tr key={customer.name} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{customer.name}</td>
                                <td className="px-6 py-4 text-right font-bold">{formatCurrency(customer.totalSpent)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default SalesAnalysisView;
