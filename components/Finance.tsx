import React, { useState } from 'react';
import { Subsidiary, SupplierDebt, FinancialTransaction, FinanceView, Order, Product, ExpenseRecord, Sale, Equipment } from '../types';
import CreditManagement from './finance/CreditManagement';
import TreasuryManagement from './finance/TreasuryManagement';
import SupplierDebts from './finance/SupplierDebts';
import ExpenseManagement from './finance/ExpenseManagement';
import ProfitAndLossStatement from './finance/ProfitAndLossStatement';
import { useI18n } from '../i18n';
import IconDocumentChartBar from './icons/IconDocumentChartBar';
import BalanceSheet from './finance/BalanceSheet';
import IconScale from './icons/IconScale';

interface FinanceProps {
    subsidiary: Subsidiary;
    supplierDebts: SupplierDebt[];
    financialTransactions: FinancialTransaction[];
    orders: Order[];
    products: Product[];
    expenseRecords: ExpenseRecord[];
    sales: Sale[];
    equipment: Equipment[];
}

const Finance: React.FC<FinanceProps> = ({ subsidiary, supplierDebts, financialTransactions, orders, products, expenseRecords, sales, equipment }) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<FinanceView>(FinanceView.CREDIT);

    const renderActiveView = () => {
        const props = { subsidiary, supplierDebts, financialTransactions, orders, products, expenseRecords, sales, equipment };
        switch (activeTab) {
            case FinanceView.CREDIT:
                return <CreditManagement subsidiary={subsidiary} />;
            case FinanceView.TREASURY:
                return <TreasuryManagement subsidiary={subsidiary} financialTransactions={financialTransactions} />;
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