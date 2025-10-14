import React, { useMemo } from 'react';
import { Kpi, Subsidiary, StockChartData, SalesChartData, Product, Sale, Contact, User, UserRole, Order } from '../../types';
import { categoryToKeyMap } from '../../constants';
import KpiCard from '../../Pages/KpiCard';
import SalesChart from '../../Pages/SalesChart';
import StockChart from '../../Pages/StockChart';
import IconTrendingUp from '../icons/IconTrendingUp';
import IconCurrency from '../icons/IconCurrency';
import IconUsers from '../icons/IconUsers';
import IconStock from '../icons/IconStock';
import { useI18n } from '../../i18n';

interface DashboardViewProps {
  subsidiary: Subsidiary;
  period: string;
  startDate?: string;
  endDate?: string;
  products: Product[];
  sales: Sale[];
  orders: Order[];
  clients: Contact[];
  currentUser: User;
}

const DashboardView: React.FC<DashboardViewProps> = ({ subsidiary, period, startDate, endDate, products, sales, orders, clients, currentUser }) => {
    const { t, formatCurrency } = useI18n();

    const { filteredOrders, filteredSales, filteredClients } = useMemo(() => {
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
                case 'seven_days':
                    startPeriodDate.setDate(now.getDate() - 6);
                    break;
                case 'thirty_days':
                    startPeriodDate.setDate(now.getDate() - 29);
                    break;
                case 'ninety_days':
                    startPeriodDate.setDate(now.getDate() - 89);
                    break;
                case 'this_month':
                    startPeriodDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endPeriodDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    break;
                case 'last_month':
                    startPeriodDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    endPeriodDate = new Date(now.getFullYear(), now.getMonth(), 0);
                    break;
                case 'year':
                    startPeriodDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startPeriodDate.setDate(now.getDate() - 29);
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

        let clientsData = clients.filter(c => {
            const clientSinceDate = new Date(c.since);
             return c.subsidiaryId === subsidiary.id && clientSinceDate >= startPeriodDate && clientSinceDate <= endPeriodDate;
        });

        // Filter by sales rep if user is a commercial
        if (currentUser.role === UserRole.COMMERCIAL) {
            ordersData = ordersData.filter(o => o.salesRepId === currentUser.id);
            salesData = salesData.filter(s => s.salesRepId === currentUser.id);
            clientsData = clientsData.filter(c => c.salesRepId === currentUser.id);
        }

        return { filteredOrders: ordersData, filteredSales: salesData, filteredClients: clientsData };

    }, [subsidiary.id, period, startDate, endDate, orders, sales, clients, currentUser]);

    // --- Data processing specific to the subsidiary ---
    const subsidiaryProducts = products.filter(p => p.subsidiaryId === subsidiary.id);

    // Calculate KPIs
    const totalSalesFromOrders = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalSalesFromCaisse = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalSales = totalSalesFromOrders + totalSalesFromCaisse;
    
    const newClients = filteredClients.length;
    const stockValue = subsidiaryProducts.reduce((sum, product) => sum + (product.stock * product.price), 0);
    
    const categoryData = subsidiaryProducts.reduce((acc, product) => {
        if (!acc[product.category]) {
            acc[product.category] = 0;
        }
        acc[product.category] += product.stock;
        return acc;
    }, {} as Record<string, number>);

    const subsidiaryStockChartData: StockChartData[] = Object.entries(categoryData).map(([categoryName, stockVal]) => ({
        key: categoryName,
        value: stockVal,
        nameKey: categoryToKeyMap[categoryName] || categoryName,
    }));
    
    const salesByDay: Record<string, number> = {};
    const dayMapping: Record<number, string> = { 0: 'weekdays.sun', 1: 'weekdays.mon', 2: 'weekdays.tue', 3: 'weekdays.wed', 4: 'weekdays.thu', 5: 'weekdays.fri', 6: 'weekdays.sat' };
    
    filteredOrders.forEach(order => {
        const saleDate = new Date(order.date);
        const dayKey = dayMapping[saleDate.getDay()];
        if (dayKey) {
            if (!salesByDay[dayKey]) salesByDay[dayKey] = 0;
            salesByDay[dayKey] += order.totalAmount;
        }
    });

    filteredSales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const dayKey = dayMapping[saleDate.getDay()];
        if (dayKey) {
            if (!salesByDay[dayKey]) salesByDay[dayKey] = 0;
            salesByDay[dayKey] += sale.totalPrice;
        }
    });

    const orderedDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const subsidiarySalesChartData: SalesChartData[] = orderedDays.map(day => ({
      key: `weekdays.${day}`,
      sales: salesByDay[`weekdays.${day}`] || 0
    }));

    const kpis: Kpi[] = [
        { titleKey: "analytics.dashboard.totalSalesMonth", value: formatCurrency(totalSales), change: "+12.5%", changeType: 'increase', icon: <IconTrendingUp className="h-8 w-8 text-green-500" /> },
        { titleKey: "analytics.dashboard.netRevenue", value: formatCurrency(totalSales * 0.42), change: "+8.2%", changeType: 'increase', icon: <IconCurrency className="h-8 w-8 text-blue-500" /> },
        { titleKey: "analytics.dashboard.newCustomers", value: newClients.toString(), change: `+${newClients}`, changeType: 'increase', icon: <IconUsers className="h-8 w-8 text-[#c6e911]" /> },
        { titleKey: "analytics.dashboard.stockValue", value: formatCurrency(stockValue), change: "", changeType: 'increase', icon: <IconStock className="h-8 w-8 text-indigo-500" /> },
    ];
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map(kpi => <KpiCard key={kpi.titleKey} {...kpi} />)}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                    <h3 className="font-semibold text-lg mb-4 text-slate-700">{t('analytics.dashboard.weeklySalesPerformance')}</h3>
                    <SalesChart data={subsidiarySalesChartData} />
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                    <h3 className="font-semibold text-lg mb-4 text-slate-700">{t('analytics.dashboard.stockDistributionByCategory')}</h3>
                    <StockChart data={subsidiaryStockChartData} />
                </div>
            </div>
        </div>
    );
};

export default DashboardView;