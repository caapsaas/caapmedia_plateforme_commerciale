

import React, { useMemo } from 'react';
import { Subsidiary, PurchaseOrder, Product, Kpi } from '../../types';
import { useI18n } from '../../i18n';
import KpiCard from '../../Pages/KpiCard';
import IconTrendingUp from '../icons/IconTrendingUp';
import IconCurrency from '../icons/IconCurrency';
import IconTruck from '../icons/IconTruck';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PurchaseChart from '../../Pages/PurchaseChart';


interface PurchaseAnalysisViewProps {
  subsidiary: Subsidiary;
  period: string;
  startDate?: string;
  endDate?: string;
  purchaseOrders: PurchaseOrder[];
  products: Product[];
}

const COLORS = ['#c6e911', '#231F20', '#6B7280', '#FBBF24', '#38BDF8', '#8B5CF6'];

const PurchaseAnalysisView: React.FC<PurchaseAnalysisViewProps> = ({ subsidiary, period, startDate, endDate, purchaseOrders, products }) => {
  const { t, formatCurrency } = useI18n();

  const filteredPurchaseOrders = useMemo(() => {
    let filtered = purchaseOrders.filter(po => po.subsidiaryId === subsidiary.id);
    
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
        
      filtered = filtered.filter(po => {
        const orderDate = new Date(po.orderDate);
        return orderDate >= startPeriodDate && orderDate <= endPeriodDate;
      });
    }

    return filtered;
  }, [subsidiary.id, period, startDate, endDate, purchaseOrders]);

  const totalPurchaseValue = filteredPurchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
  const totalOrders = filteredPurchaseOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalPurchaseValue / totalOrders : 0;

  const kpis: Kpi[] = [
      { titleKey: "purchaseAnalysis.totalPurchaseValue", value: formatCurrency(totalPurchaseValue), change: "+5%", changeType: 'increase', icon: <IconCurrency className="h-8 w-8 text-blue-500" /> },
      { titleKey: "purchaseAnalysis.totalOrders", value: totalOrders.toString(), change: "+2", changeType: 'increase', icon: <IconTruck className="h-8 w-8 text-green-500" /> },
      { titleKey: "purchaseAnalysis.averageOrderValue", value: formatCurrency(averageOrderValue), change: "-1.2%", changeType: 'decrease', icon: <IconTrendingUp className="h-8 w-8 text-red-500" /> },
  ];

  const spendingBySupplier = useMemo(() => {
    const data = filteredPurchaseOrders.reduce((acc, po) => {
        if (!acc[po.supplierName]) {
            acc[po.supplierName] = 0;
        }
        acc[po.supplierName] += po.totalAmount;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredPurchaseOrders]);

  const purchasesOverTime = useMemo(() => {
      const data: {[key: string]: number} = {};
      filteredPurchaseOrders.forEach(po => {
          const date = new Date(po.orderDate).toLocaleDateString();
          if(!data[date]) data[date] = 0;
          data[date] += po.totalAmount;
      });
      return Object.entries(data).map(([key, purchases]) => ({ key, purchases }));
  }, [filteredPurchaseOrders]);

  const topPurchasedProducts = useMemo(() => {
    const productData: {[key: string]: { name: string, quantity: number, value: number }} = {};
    filteredPurchaseOrders.forEach(po => {
        po.items.forEach(item => {
            if(!productData[item.productId]) {
                productData[item.productId] = { name: item.productName, quantity: 0, value: 0 };
            }
            productData[item.productId].quantity += item.quantity;
            productData[item.productId].value += item.quantity * item.purchasePrice;
        });
    });
    return Object.values(productData).sort((a,b) => b.value - a.value).slice(0, 5);
  }, [filteredPurchaseOrders]);


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
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="font-semibold text-lg mb-4 text-slate-700">{t('purchaseAnalysis.topPurchasedProducts')}</h3>
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
        </div>
    </div>
  );
};

export default PurchaseAnalysisView;