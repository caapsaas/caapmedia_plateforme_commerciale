

import React, { useState, useMemo } from 'react';
import { Subsidiary, Order, Product, ExpenseRecord, ExpenseCategory, Sale } from '../../types';
import { useI18n } from '../../i18n';
import PeriodFilter from '../filters/PeriodFilter';
import IconPrint from '../icons/IconPrint';
import IconPdf from '../icons/IconPdf';
import { exportToPdf } from '../../utils/pdfExporter';

interface ProfitAndLossStatementProps {
    subsidiary: Subsidiary;
    orders: Order[];
    products: Product[];
    expenseRecords: ExpenseRecord[];
    sales: Sale[];
}

const ProfitAndLossStatement: React.FC<ProfitAndLossStatementProps> = ({ subsidiary, orders, products, expenseRecords, sales }) => {
    const { t, formatCurrency } = useI18n();
    const [period, setPeriod] = useState<string>('this_month');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPeriod = e.target.value;
        setPeriod(newPeriod);
        if (newPeriod !== 'custom') {
            setStartDate('');
            setEndDate('');
        }
    };
    
    const pnlData = useMemo(() => {
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
                case 'this_month':
                    startPeriodDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endPeriodDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    break;
                case 'last_month':
                    startPeriodDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    endPeriodDate = new Date(now.getFullYear(), now.getMonth(), 0);
                    break;
                case 'thirty_days':
                    startPeriodDate.setDate(now.getDate() - 29);
                    break;
                case 'year':
                    startPeriodDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default: // Default to this_month
                    startPeriodDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endPeriodDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            }
        }

        const filteredOrders = orders.filter(o => {
            const orderDate = new Date(o.date);
            return o.subsidiaryId === subsidiary.id && orderDate >= startPeriodDate && orderDate <= endPeriodDate;
        });
        
        const filteredSales = sales.filter(s => {
            const saleDate = new Date(s.date);
            return s.subsidiaryId === subsidiary.id && saleDate >= startPeriodDate && saleDate <= endPeriodDate;
        });

        const filteredExpenses = expenseRecords.filter(e => {
            const expenseDate = new Date(e.date);
            return e.subsidiaryId === subsidiary.id && expenseDate >= startPeriodDate && expenseDate <= endPeriodDate;
        });
        
        // Revenue calculation (HT)
        const revenueFromOrders = filteredOrders.reduce((sum, order) => sum + order.subtotal, 0);
        const revenueFromCaisse = filteredSales.reduce((sum, sale) => sum + (sale.totalPrice / (1 + sale.taxRate)), 0);
        const revenue = revenueFromOrders + revenueFromCaisse;
        
        // COGS calculation
        const cogsFromOrders = filteredOrders.reduce((sum, order) => {
            return sum + order.items.reduce((itemSum, item) => {
                const product = products.find(p => p.id === item.product.id);
                return itemSum + ((product?.price || 0) * item.quantity);
            }, 0);
        }, 0);
        const cogsFromCaisse = filteredSales.reduce((sum, sale) => {
            const product = products.find(p => p.productName === sale.productName);
            return sum + ((product?.price || 0) * sale.quantity);
        }, 0);
        const cogs = cogsFromOrders + cogsFromCaisse;

        const grossProfit = revenue - cogs;
        
        // Operating expenses (excluding purchase costs to avoid double-counting)
        const operatingExpensesRecords = filteredExpenses.filter(e => e.category !== ExpenseCategory.PURCHASE_COST);
        const operatingExpenses = operatingExpensesRecords.reduce((sum, expense) => sum + expense.amount, 0);
        
        const expensesByCategory = operatingExpensesRecords.reduce((acc, expense) => {
            if(!acc[expense.category]) {
                acc[expense.category] = 0;
            }
            acc[expense.category] += expense.amount;
            return acc;
        }, {} as Record<ExpenseCategory, number>);

        const operatingIncome = grossProfit - operatingExpenses;
        const tax = operatingIncome > 0 ? operatingIncome * 0.30 : 0; // Simplified 30% tax
        const netIncome = operatingIncome - tax;

        return { revenue, cogs, grossProfit, operatingExpenses, operatingIncome, tax, netIncome, expensesByCategory };

    }, [subsidiary.id, period, startDate, endDate, orders, sales, products, expenseRecords]);

    const handlePrint = () => window.print();
    
    const handleExportPdf = () => {
        // This would require a more complex PDF generation logic
        alert('PDF export for P&L is a planned feature.');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6 no-print">
                <h3 className="text-xl font-semibold text-slate-800">{t('pnl.title')}</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                     <PeriodFilter 
                        period={period}
                        onPeriodChange={handlePeriodChange}
                        startDate={startDate}
                        onStartDateChange={e => setStartDate(e.target.value)}
                        endDate={endDate}
                        onEndDateChange={e => setEndDate(e.target.value)}
                    />
                    <button onClick={handlePrint} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        <IconPrint className="h-4 w-4" />
                        <span>{t('common.print')}</span>
                    </button>
                    <button onClick={handleExportPdf} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        <IconPdf className="h-4 w-4" />
                        <span>{t('common.exportPdf')}</span>
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                <h4 className="text-center font-bold text-2xl mb-1">{subsidiary.name}</h4>
                <p className="text-center text-lg text-slate-700 mb-6">{t('pnl.title')}</p>

                <div className="divide-y divide-slate-200">
                    <div className="py-3 flex justify-between">
                        <span className="font-semibold">{t('pnl.revenue')}</span>
                        <span className="font-semibold">{formatCurrency(pnlData.revenue)}</span>
                    </div>
                    <div className="py-3 pl-4 flex justify-between">
                        <span className="text-slate-600">{t('pnl.cogs')}</span>
                        <span className="text-slate-600">({formatCurrency(pnlData.cogs)})</span>
                    </div>
                     <div className="py-3 flex justify-between font-bold border-t-2 border-slate-800">
                        <span>{t('pnl.grossProfit')}</span>
                        <span>{formatCurrency(pnlData.grossProfit)}</span>
                    </div>

                    <div className="pt-6 pb-2 flex justify-between">
                        <span className="font-semibold">{t('pnl.operatingExpenses')}</span>
                        <span className="font-semibold">({formatCurrency(pnlData.operatingExpenses)})</span>
                    </div>
                    {Object.entries(pnlData.expensesByCategory).map(([category, amount]) => (
                         <div key={category} className="py-2 pl-4 flex justify-between">
                            <span className="text-slate-600">{t(`expenses.categories.${category}`)}</span>
                            <span className="text-slate-600">({formatCurrency(amount)})</span>
                        </div>
                    ))}
                    
                     <div className="py-3 flex justify-between font-bold border-t-2 border-slate-800 mt-4">
                        <span>{t('pnl.operatingIncome')}</span>
                        <span>{formatCurrency(pnlData.operatingIncome)}</span>
                    </div>
                     <div className="py-3 pl-4 flex justify-between">
                        <span className="text-slate-600">{t('pnl.tax')}</span>
                        <span className="text-slate-600">({formatCurrency(pnlData.tax)})</span>
                    </div>
                     <div className="py-4 flex justify-between font-extrabold text-lg bg-slate-100 px-2 rounded-md">
                        <span>{t('pnl.netIncome')}</span>
                        <span className={pnlData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(pnlData.netIncome)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitAndLossStatement;
