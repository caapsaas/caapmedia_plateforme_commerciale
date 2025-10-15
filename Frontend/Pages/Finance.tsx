import React, { useState } from 'react';
import { Subsidiary, SupplierDebt, FinancialTransaction, FinanceView, Order, Product, ExpenseRecord, Sale, Equipment, Contact } from '../types';
import CreditManagement from '../components/finance/CreditManagement';
import TreasuryManagement from '../components/finance/TreasuryManagement';
import SupplierDebts from '../components/finance/SupplierDebts';
import ExpenseManagement from '../components/finance/ExpenseManagement';
import ProfitAndLossStatement from '../components/finance/ProfitAndLossStatement';
import { useI18n } from '../i18n';
import { useQuery } from '@tanstack/react-query';
import IconDocumentChartBar from '../components/icons/IconDocumentChartBar';
import BalanceSheet from '../components/finance/BalanceSheet';
import IconScale from '../components/icons/IconScale';
// Importez vos fonctions de service API ici
import { getSupplierDebts } from '../services/apiFinance/apiDebts'; 
import { getFinancialTransactions } from '../services/apiFinance/apiTreasury';
import { getOrders } from '../services/apiE-commerce/apiOrders';
import { getProducts } from '../services/apiE-commerce/apiProducts';
import { getExpenses } from '../services/apiFinance/apiExpense';
import { getSales } from '../services/apiE-commerce/apiSales'; // Assurez-vous que ces fonctions existent
import { getEquipments } from '../services/apiMaintenance/apiEquipment';
import { getContacts } from '../services/apiCrm/apicontacts';

interface FinanceProps {
    subsidiary: Subsidiary;
}

const Finance: React.FC<FinanceProps> = ({ subsidiary }) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<FinanceView>(FinanceView.CREDIT);

    // Utilisez TanStack Query pour récupérer les données nécessaires
    const { data: supplierDebts = [], isLoading: l1 } = useQuery({ queryKey: ['supplierDebts', subsidiary.id], queryFn: () => getSupplierDebts() });
    const { data: financialTransactions = [], isLoading: l2 } = useQuery({ queryKey: ['financialTransactions', subsidiary.id], queryFn: () => getFinancialTransactions() });
    const { data: orders = [], isLoading: l3 } = useQuery({ queryKey: ['orders', subsidiary.id], queryFn: () => getOrders({}) });
    const { data: products = [], isLoading: l4 } = useQuery({ queryKey: ['products', subsidiary.id], queryFn: () => getProducts() });
    const { data: expenseRecords = [], isLoading: l5 } = useQuery({ queryKey: ['expenseRecords', subsidiary.id], queryFn: () => getExpenses() });
    const { data: sales = [], isLoading: l6 } = useQuery({ queryKey: ['sales', subsidiary.id], queryFn: () => getSales({}) });
    const { data: equipment = [], isLoading: l7 } = useQuery({ queryKey: ['equipment', subsidiary.id], queryFn: () => getEquipments() });
    const { data: contacts = [], isLoading: l8 } = useQuery({ queryKey: ['contacts', subsidiary.id], queryFn: () => getContacts() });

    const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8;

    const renderActiveView = () => {
        if (isLoading) {
            return <div className="p-6 text-center">{t('common.loading')}</div>;
        }

        const props = { subsidiary, supplierDebts, financialTransactions, orders, products, expenseRecords, sales, equipment, contacts };
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
                return <BalanceSheet {...props} />;
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