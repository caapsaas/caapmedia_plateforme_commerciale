import React, { useState, useMemo } from 'react';
import { Subsidiary, Order, Product, ExpenseRecord, Sale, Equipment, SupplierDebt, FinancialTransaction, ExpenseCategory, PaymentStatus, TreasuryAccount } from '../../types';
import { useI18n } from '../../i18n';

interface BalanceSheetProps {
    subsidiary: Subsidiary;
    orders: Order[];
    products: Product[];
    expenseRecords: ExpenseRecord[];
    sales: Sale[];
    equipment: Equipment[];
    supplierDebts: SupplierDebt[];
    financialTransactions: FinancialTransaction[];
    treasuryAccounts: TreasuryAccount[]; // Ajout pour un calcul de trésorerie correct
}

const BalanceSheet: React.FC<BalanceSheetProps> = ({
    subsidiary, orders, products, expenseRecords, sales, equipment, supplierDebts, financialTransactions, treasuryAccounts
}) => {
    const { t, formatCurrency } = useI18n();
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    const data = useMemo(() => {
        const endDate = new Date(asOfDate);
        endDate.setHours(23, 59, 59, 999);
        const startOfYear = new Date(endDate.getFullYear(), 0, 1);

        // ACTIFS
        // CORRECT: Le solde de trésorerie est la somme des soldes de tous les comptes.
        // Le backend maintient déjà ce solde à jour.
        const cash = treasuryAccounts.reduce((sum, account) => sum + account.balance, 0);
        
        const accountsReceivable = orders
            .filter(o => o.subsidiaryId === subsidiary.id && new Date(o.date) <= endDate && o.paymentStatus !== PaymentStatus.PAID)
            .reduce((sum, o) => sum + (o.totalAmount - o.amountPaid), 0);

        const inventoryValue = products
            .filter(p => p.subsidiaryId === subsidiary.id)
            .reduce((sum, p) => sum + (p.stock * p.price), 0); // Note: Utiliser le prix de revient serait plus juste
        
        const fixedAssets = equipment
            .filter(e => e.subsidiaryId === subsidiary.id && new Date(e.acquisitionDate) <= endDate)
            .reduce((sum, e) => sum + e.acquisitionValue, 0);

        const totalAssets = cash + accountsReceivable + inventoryValue + fixedAssets;

        // PASSIFS & CAPITAUX PROPRES
        const accountsPayable = supplierDebts
            .filter(d => d.subsidiaryId === subsidiary.id && new Date(d.dueDate) <= endDate && d.status !== 'Payé')
            .reduce((sum, d) => sum + d.amount, 0);
        
        const shareCapital = subsidiary.shareCapital;

        // Calcul du Résultat Net (identique à ProfitAndLossStatement pour la cohérence)
        const filteredOrders = orders.filter(o => o.subsidiaryId === subsidiary.id && new Date(o.date) >= startOfYear && new Date(o.date) <= endDate);
        const filteredSales = sales.filter(s => s.subsidiaryId === subsidiary.id && new Date(s.date) >= startOfYear && new Date(s.date) <= endDate);
        const filteredExpenses = expenseRecords.filter(e => e.subsidiaryId === subsidiary.id && new Date(e.date) >= startOfYear && new Date(e.date) <= endDate);

        const revenueFromOrders = filteredOrders.reduce((sum, order) => sum + order.subtotal, 0);
        const revenueFromCaisse = filteredSales.reduce((sum, sale) => sum + (sale.totalPrice / (1 + sale.taxRate)), 0);
        const revenue = revenueFromOrders + revenueFromCaisse;

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
        const operatingExpenses = filteredExpenses.filter(e => e.category !== ExpenseCategory.PURCHASE_COST).reduce((sum, expense) => sum + expense.amount, 0);
        const operatingIncome = grossProfit - operatingExpenses;
        const tax = operatingIncome > 0 ? operatingIncome * 0.30 : 0;
        const netIncome = operatingIncome - tax;
        
        const totalLiabilitiesAndEquity = accountsPayable + shareCapital + netIncome;

        return { cash, accountsReceivable, inventoryValue, fixedAssets, totalAssets, accountsPayable, shareCapital, netIncome, totalLiabilitiesAndEquity };    
    }, [asOfDate, subsidiary.id, orders, products, expenseRecords, sales, equipment, supplierDebts, financialTransactions, treasuryAccounts, subsidiary.shareCapital]);

    const DataRow: React.FC<{ label: string; value: number; isTotal?: boolean; indent?: boolean }> = ({ label, value, isTotal, indent }) => (
        <div className={`flex justify-between py-2 ${isTotal ? 'font-bold border-t pt-3 mt-2' : ''} ${indent ? 'pl-4' : ''}`}>
            <span>{label}</span>
            <span>{formatCurrency(value)}</span>
        </div>
    );
    
    const HeaderRow: React.FC<{ title: string; }> = ({ title }) => (
        <h4 className="font-bold text-lg text-slate-800 mt-4 mb-2">{title}</h4>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6">
                <h3 className="text-xl font-semibold text-slate-800">{t('finance.bilan.title')}</h3>
                <div className="flex items-center gap-2 self-start lg:self-center">
                    <label htmlFor="asOfDate" className="text-sm font-medium">{t('finance.bilan.asOfDate')}:</label>
                    <input type="date" id="asOfDate" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="border-slate-300 rounded-md shadow-sm" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Assets Column */}
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-center border-b-2 pb-2 mb-2">{t('finance.bilan.assets')}</h3>
                    
                    <HeaderRow title={t('finance.bilan.currentAssets')} />
                    <DataRow label={t('finance.bilan.cash')} value={data.cash} indent />
                    <DataRow label={t('finance.bilan.accountsReceivable')} value={data.accountsReceivable} indent />
                    <DataRow label={t('finance.bilan.inventory')} value={data.inventoryValue} indent />

                    <HeaderRow title={t('finance.bilan.fixedAssets')} />
                    <DataRow label={t('finance.bilan.equipment')} value={data.fixedAssets} indent />

                    <DataRow label={t('finance.bilan.totalAssets')} value={data.totalAssets} isTotal />
                </div>

                {/* Liabilities & Equity Column */}
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-center border-b-2 pb-2 mb-2">{t('finance.bilan.liabilitiesAndEquity')}</h3>
                    
                    <HeaderRow title={t('finance.bilan.liabilities')} />
                    <DataRow label={t('finance.bilan.accountsPayable')} value={data.accountsPayable} indent />

                    <HeaderRow title={t('finance.bilan.equity')} />
                    <DataRow label={t('finance.bilan.shareCapital')} value={data.shareCapital} indent />
                    <DataRow label={t('finance.bilan.netIncome')} value={data.netIncome} indent />

                    <DataRow label={t('finance.bilan.totalLiabilitiesAndEquity')} value={data.totalLiabilitiesAndEquity} isTotal />
                </div>
            </div>
        </div>
    );
};

export default BalanceSheet;
