import React from 'react';
import { Subsidiary } from '../../types';
import { BalanceSheet as BalanceSheetType } from '../../services/apiStatistic/apiFinanceStats';
import { useI18n } from '../../i18n';

interface BalanceSheetProps {
    subsidiary: Subsidiary;
    balanceSheetData?: BalanceSheetType;
}

const BalanceSheet: React.FC<BalanceSheetProps> = ({ subsidiary, balanceSheetData }) => {
    const { t, formatCurrency } = useI18n();
    
    if (!balanceSheetData) {
        return <div className="p-6 text-center">{t('common.loading')}</div>;
    }

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
                <h3 className="text-xl font-semibold text-slate-800">{t('finance.bilan.title')} - {subsidiary.name}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Assets Column */}
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-center border-b-2 pb-2 mb-2">{t('finance.bilan.assets')}</h3>

                    <HeaderRow title={t('finance.bilan.currentAssets')} />
                    <DataRow label={t('finance.bilan.cash')} value={balanceSheetData.assets.treasury} indent />
                    <DataRow label={t('finance.bilan.accountsReceivable')} value={balanceSheetData.assets.customerReceivables} indent />
                    <DataRow label={t('finance.bilan.inventory')} value={balanceSheetData.assets.inventory} indent />

                    <HeaderRow title={t('finance.bilan.fixedAssets')} />
                    <DataRow label={t('finance.bilan.equipment')} value={balanceSheetData.assets.equipments} indent />

                    <DataRow label={t('finance.bilan.totalAssets')} value={balanceSheetData.totalAssets} isTotal />
                </div>

                {/* Liabilities & Equity Column */}
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-center border-b-2 pb-2 mb-2">{t('finance.bilan.liabilitiesAndEquity')}</h3>

                    <HeaderRow title={t('finance.bilan.liabilities')} />
                    <DataRow label={t('finance.bilan.accountsPayable')} value={balanceSheetData.liabilities.supplierDebts} indent />

                    <HeaderRow title={t('finance.bilan.equity')} />
                    <DataRow label={t('finance.bilan.shareCapital')} value={balanceSheetData.liabilities.shareCapital} indent />
                    <DataRow label={t('finance.bilan.netIncome')} value={balanceSheetData.liabilities.netIncome} indent />

                    <DataRow label={t('finance.bilan.totalLiabilitiesAndEquity')} value={balanceSheetData.totalLiabilities} isTotal />
                </div>
            </div>
        </div>
    );
};

export default BalanceSheet;
