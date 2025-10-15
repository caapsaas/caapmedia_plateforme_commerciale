import React, { useMemo } from 'react';
import { Subsidiary, Order, Sale, Product, Contact, User, UserRole, Kpi, StockChartData } from '../../types';
import { useI18n } from '../../i18n';
// FIX: Import the newly added TAX_RATE constant.
import { categoryToKeyMap, MOCK_TAX_RATES as TAX_RATE } from '../../constants';
import KpiCard from '../../Pages/KpiCard';
import StockChart from '../../Pages/StockChart';
import IconTrendingUp from '../icons/IconTrendingUp';
import IconCurrency from '../icons/IconCurrency';
import IconUsers from '../icons/IconUsers';
import IconSales from '../icons/IconSales';

interface SalesAnalysisViewProps {
  subsidiary: Subsidiary;
  period: string;
  startDate?: string;
  endDate?: string;
  orders: Order[];
  sales: Sale[];
  products: Product[];
  clients: Contact[];
  currentUser: User;
}

const SalesAnalysisView: React.FC<SalesAnalysisViewProps> = ({ subsidiary, period, startDate, endDate, orders, sales, products, clients, currentUser }) => {
  const { t, formatCurrency, formatNumber } = useI18n();

  const { filteredOrders, filteredSales } = useMemo(() => {
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
            case 'this_month': startPeriodDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
            case 'last_month':
                startPeriodDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endPeriodDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'year': startPeriodDate = new Date(now.getFullYear(), 0, 1); break;
            default: startPeriodDate.setDate(now.getDate() - 29);
        }
    }
    
    let ordersData = orders.filter(o => {
        const orderDate = new Date(o.date);
        return o.subsidiaryId === subsidiary.id && orderDate >= startPeriodDate && orderDate <= endPeriodDate;
    });

    let salesData = sales.filter(s => {
        const saleDate = new Date(s.date);
        return s.subsidiaryId === subsidiary.id && saleDate >= startPeriodDate && saleDate <= endPeriodDate;
    });

    if (currentUser.role === UserRole.COMMERCIAL) {
        ordersData = ordersData.filter(o => o.salesRepId === currentUser.id);
        salesData = salesData.filter(s => s.salesRepId === currentUser.id);
    }

    return { filteredOrders: ordersData, filteredSales: salesData };

  }, [subsidiary.id, period, startDate, endDate, orders, sales, currentUser]);

  const kpis = useMemo((): Kpi[] => {
    const revenueFromOrders = filteredOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const revenueFromCaisse = filteredSales.reduce((sum, s) => sum + (s.totalPrice / (1 + s.taxRate)), 0);
    const totalRevenue = revenueFromOrders + revenueFromCaisse;
    const orderCount = filteredOrders.length;
    const cashSaleCount = filteredSales.length;
    const averageBasket = orderCount > 0 ? revenueFromOrders / orderCount : 0;
    
    return [
      { titleKey: 'salesAnalysis.totalRevenue', value: formatCurrency(totalRevenue), change: '+12%', changeType: 'increase', icon: <IconCurrency className="h-8 w-8 text-blue-500" /> },
      { titleKey: 'salesAnalysis.orderCount', value: formatNumber(orderCount), change: '+5', changeType: 'increase', icon: <IconSales className="h-8 w-8 text-green-500" /> },
      { titleKey: 'salesAnalysis.cashSaleCount', value: formatNumber(cashSaleCount), change: '+30', changeType: 'increase', icon: <IconTrendingUp className="h-8 w-8 text-indigo-500" /> },
      { titleKey: 'salesAnalysis.averageBasket', value: formatCurrency(averageBasket), change: '-2.5%', changeType: 'decrease', icon: <IconUsers className="h-8 w-8 text-red-500" /> },
    ];
  }, [filteredOrders, filteredSales, formatCurrency, formatNumber, t]);

  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            if (!productSales[item.product.id]) {
                productSales[item.product.id] = { name: item.product.name, quantity: 0, revenue: 0 };
            }
            productSales[item.product.id].quantity += item.quantity;
            productSales[item.product.id].revenue += item.price * item.quantity;
        });
    });

    filteredSales.forEach(sale => {
        const product = products.find(p => p.name === sale.productName);
        if (product) {
            if (!productSales[product.id]) {
                productSales[product.id] = { name: product.name, quantity: 0, revenue: 0 };
            }
            productSales[product.id].quantity += sale.quantity;
            productSales[product.id].revenue += sale.totalPrice;
        }
    });

    return Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredOrders, filteredSales, products]);
  
  const salesByCategory = useMemo((): StockChartData[] => {
    const categorySales: Record<string, number> = {};
     filteredOrders.forEach(order => {
        order.items.forEach(item => {
            const category = item.product.category;
            if (!categorySales[category]) categorySales[category] = 0;
            categorySales[category] += item.price * item.quantity;
        });
    });
     filteredSales.forEach(sale => {
        const product = products.find(p => p.name === sale.productName);
        if(product){
            const category = product.category;
            if (!categorySales[category]) categorySales[category] = 0;
            categorySales[category] += sale.totalPrice / (1 + sale.taxRate);
        }
    });
     return Object.entries(categorySales).map(([categoryName, salesValue]) => ({
        key: categoryName,
        value: salesValue,
        nameKey: categoryToKeyMap[categoryName] || categoryName,
    }));
  }, [filteredOrders, filteredSales, products]);
  
  const topCustomers = useMemo(() => {
    const customerSales: Record<string, { name: string; totalSpent: number }> = {};
     filteredOrders.forEach(order => {
        const client = clients.find(c => c.id === order.customerId);
        if(client) {
            if(!customerSales[client.id]) {
                customerSales[client.id] = { name: client.name, totalSpent: 0 };
            }
            customerSales[client.id].totalSpent += order.totalAmount;
        }
    });
    return Object.values(customerSales).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  }, [filteredOrders, clients]);

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
