import React, { useState, useMemo } from 'react';
import { FinanceView } from '../types';
import { useAppContext } from '../context/AppContext';
import CreditManagement from '../components/finance/CreditManagement';
import TreasuryManagement from '../components/finance/TreasuryManagement';
import SupplierDebts from '../components/finance/SupplierDebts';
import ExpenseManagement from '../components/finance/ExpenseManagement';
import ProfitAndLossStatement from '../components/finance/ProfitAndLossStatement';
import { useI18n } from '../i18n';
import IconDocumentChartBar from '../components/icons/IconDocumentChartBar';
import BalanceSheet from '../components/finance/BalanceSheet';
import IconScale from '../components/icons/IconScale';
import { useQuery } from '@tanstack/react-query';

// Importez vos types de données réels et vos fonctions d'API
import { Order, Product, ExpenseRecord, Sale, Equipment, SupplierDebt, FinancialTransaction } from '../types';
import { getOrders } from '../services/apiE-commerce/apiOrders';
import { getProductsBySubsidiary as getProducts } from '../services/apiE-commerce/apiProducts';
import { getSales } from '../services/apiE-commerce/apiSales'; // à créer
import { getExpenses } from '../services/apiFinance/apiExpense'; // à créer
import { getSupplierDebts } from '../services/apiFinance/apiDebts'; // à créer
import { getFinancialTransactions } from '../services/apiFinance/apiTreasury'; // à créer
import { getEquipments } from '../services/apiMaintenance/apiEquipment'; // à créer

const Finance: React.FC = () => {
    const { t } = useI18n();
    const { state } = useAppContext();
    const { currentSubsidiary: subsidiary } = state;
    const [activeTab, setActiveTab] = useState<FinanceView>(FinanceView.CREDIT);

    if (!subsidiary) {
        return <div className="p-6 text-center">{t('common.loading')}</div>;
    }

    // --- Data Fetching avec React Query (similaire à Crm.tsx) ---
    const queryKey = (key: string) => [key, subsidiary.id];

    const { data: orders = [], isLoading: l1 } = useQuery<Order[]>({ queryKey: queryKey('orders'), queryFn: () => getOrders() });
    const { data: products = [], isLoading: l2 } = useQuery<Product[]>({ queryKey: queryKey('products'), queryFn: () => getProducts() });
    const { data: sales = [], isLoading: l3 } = useQuery<Sale[]>({ queryKey: queryKey('sales'), queryFn: () => getSales() });
    const { data: expenseRecords = [], isLoading: l4 } = useQuery<ExpenseRecord[]>({ queryKey: queryKey('expenseRecords'), queryFn: () => getExpenses() });
    const { data: supplierDebts = [], isLoading: l5 } = useQuery<SupplierDebt[]>({ queryKey: queryKey('supplierDebts'), queryFn: () => getSupplierDebts() });
    const { data: equipment = [], isLoading: l6 } = useQuery<Equipment[]>({ queryKey: queryKey('equipment'), queryFn: () => getEquipments() });
    const { data: financialTransactions = [], isLoading: l7 } = useQuery<FinancialTransaction[]>({ queryKey: queryKey('financialTransactions'), queryFn: () => getFinancialTransactions() });

    const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7;

    const renderActiveView = () => {
        if (isLoading) {
            return <div className="p-6 text-center">{t('common.loading')}</div>;
        }

        switch (activeTab) {
            case FinanceView.CREDIT:
                return <CreditManagement subsidiary={subsidiary} />;
            case FinanceView.TREASURY:
                return <TreasuryManagement subsidiary={subsidiary} />;
            case FinanceView.SUPPLIERS:
                return <SupplierDebts subsidiary={subsidiary} supplierDebts={supplierDebts} />;
            case FinanceView.EXPENSES:
                return <ExpenseManagement subsidiary={subsidiary} expenseRecords={expenseRecords} />;
            case FinanceView.PNL:
                return <ProfitAndLossStatement subsidiary={subsidiary} orders={orders} products={products} expenseRecords={expenseRecords} sales={sales} />;
            case FinanceView.BILAN:
                return <BalanceSheet 
                            subsidiary={subsidiary} 
                            orders={orders} 
                            products={products} 
                            expenseRecords={expenseRecords} 
                            sales={sales} 
                            equipment={equipment}
                            supplierDebts={supplierDebts}
                            financialTransactions={financialTransactions}
                        />;
            default:
                return <CreditManagement subsidiary={subsidiary} />;
        }
    };

    const TabButton: React.FC<{ view: FinanceView; label: string; icon?: React.ReactNode }> = ({ view, label, icon }) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c6e911] ${
                activeTab === view
                    ? 'bg-[#c6e911] text-slate-800 shadow'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 no-print">
                <h2 className="text-3xl font-bold text-slate-800">{t('finance.title')}</h2>
                <div className="flex items-center flex-wrap gap-2 p-1 bg-slate-200 rounded-lg self-start sm:self-center">
                    <TabButton view={FinanceView.CREDIT} label={t('finance.creditManagement')} />
                    <TabButton view={FinanceView.TREASURY} label={t('finance.treasury')} />
                    <TabButton view={FinanceView.SUPPLIERS} label={t('finance.supplierDebts')} />
                    <TabButton view={FinanceView.EXPENSES} label={t('finance.expenses')} />
                    <TabButton view={FinanceView.PNL} label={t('pnl.tabTitle')} icon={<IconDocumentChartBar className="h-4 w-4" />} />
                    <TabButton view={FinanceView.BILAN} label={t('finance.bilan.tabTitle')} icon={<IconScale className="h-4 w-4" />} />
                </div>
            </div>
            
            <div>
                {renderActiveView()}
            </div>
        </div>
    );
};

export default Finance;