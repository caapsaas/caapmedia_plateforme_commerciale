import React from 'react';
import { Kpi, StockChartData, SalesChartData } from '../../types';
import { categoryToKeyMap } from '../../constants';
import KpiCard from '../../Pages/KpiCard';
import SalesChart from '../../Pages/SalesChart';
import StockChart from '../../Pages/StockChart';
import IconTrendingUp from '../icons/IconTrendingUp';
import IconCurrency from '../icons/IconCurrency';
import IconUsers from '../icons/IconUsers';
import IconStock from '../icons/IconStock';
import { useI18n } from '../../i18n';
import { DashboardStats } from '../../services/apiStatistic/apiAnalytics';

interface DashboardViewProps {
  data: DashboardStats;
}

const DashboardView: React.FC<DashboardViewProps> = ({ data }) => {    
    const { t, formatCurrency } = useI18n();

    // --- Data processing from API ---
    const subsidiaryStockChartData: StockChartData[] = data.stockByCategory.map(item => ({
        key: item.category,
        value: item._sum.stock || 0,
        nameKey: categoryToKeyMap[item.category] || item.category,
    }));
    
    const subsidiarySalesChartData: SalesChartData[] = data.salesPerformance.map(item => ({
        key: item.date, // La clé est maintenant la date
        sales: item.sales
    }));
    
    const kpis: Kpi[] = [
        { titleKey: "analytics.dashboard.totalSalesMonth", value: formatCurrency(data.totalSales), change: "+12.5%", changeType: 'increase', icon: <IconTrendingUp className="h-8 w-8 text-green-500" /> },
        { titleKey: "analytics.dashboard.netRevenue", value: formatCurrency(data.netRevenue), change: "+8.2%", changeType: 'increase', icon: <IconCurrency className="h-8 w-8 text-blue-500" /> },
        { titleKey: "analytics.dashboard.newCustomers", value: data.newCustomers.toString(), change: `+${data.newCustomers}`, changeType: 'increase', icon: <IconUsers className="h-8 w-8 text-[#c6e911]" /> },
        { titleKey: "analytics.dashboard.stockValue", value: formatCurrency(data.stockValue), change: "", changeType: 'increase', icon: <IconStock className="h-8 w-8 text-indigo-500" /> },
    ];
    
    // Pour le graphique de répartition du stock, nous utilisons maintenant `stockDistribution` qui est une valeur monétaire
    const stockValueDistributionChartData: StockChartData[] = Object.entries(data.stockDistribution).map(([categoryName, value]) => ({
        key: categoryName,
        value: value,
        nameKey: categoryToKeyMap[categoryName] || categoryName,
    }));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map(kpi => <KpiCard key={kpi.titleKey} {...kpi} />)}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 min-w-0">
                    <h3 className="font-semibold text-lg mb-4 text-slate-700">{t('analytics.dashboard.weeklySalesPerformance')}</h3>
                    <SalesChart data={subsidiarySalesChartData} />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md min-w-0">
                    <h3 className="font-semibold text-lg mb-4 text-slate-700">{t('analytics.dashboard.stockDistributionByCategory')}</h3>
                    <StockChart data={stockValueDistributionChartData} />
                </div>
            </div>
        </div>
    );
};

export default DashboardView;