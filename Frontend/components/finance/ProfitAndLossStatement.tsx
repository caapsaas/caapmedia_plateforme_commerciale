import React from 'react';
import { Subsidiary } from '../../types';
import { useI18n } from '../../i18n';
import PeriodFilter from '../filters/PeriodFilter';
import IconPrint from '../icons/IconPrint';
import IconPdf from '../icons/IconPdf';

interface ProfitAndLossStatementProps {
    subsidiary: Subsidiary;
    pnlData?: any;
    period: string;
    onPeriodChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    startDate: string;
    onStartDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    endDate: string;
    onEndDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfitAndLossStatement: React.FC<ProfitAndLossStatementProps> = ({ 
    subsidiary, pnlData, period, onPeriodChange, startDate, onStartDateChange, endDate, onEndDateChange 
}) => {
    const { t, formatCurrency } = useI18n();

    const handlePrint = () => window.print();
    
    const handleExportPdf = () => {
        // This would require a more complex PDF generation logic
        alert('PDF export for P&L is a planned feature.');
    };
    
    // Si les données ne sont pas encore chargées, on affiche un placeholder ou rien.
    if (!pnlData) {
        return <div>{t('common.loading')}</div>;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6 no-print">
                <h3 className="text-xl font-semibold text-slate-800">{t('pnl.title')}</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                     <PeriodFilter 
                        period={period}
                        onPeriodChange={onPeriodChange}
                        startDate={startDate}
                        onStartDateChange={onStartDateChange}
                        endDate={endDate}
                        onEndDateChange={onEndDateChange}
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

                    <div className="py-3 flex justify-between font-bold border-t-2 border-slate-800 mt-4">
                        <span className="font-semibold">{t('pnl.operatingExpenses')}</span>
                        <span className="font-semibold">({formatCurrency(pnlData.operatingExpenses)})</span>
                    </div>
                    
                    <div className="py-3 flex justify-between font-bold border-t-2 border-slate-800">
                        <span>{t('pnl.operatingIncome')}</span> 
                        <span>{formatCurrency(pnlData.grossProfit - pnlData.operatingExpenses)}</span>
                    </div>

                     <div className="py-3 pl-4 flex justify-between">
                        <span className="text-slate-600">{t('pnl.tax')}</span>
                        <span className="text-slate-600">({formatCurrency(pnlData.taxes)})</span>
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
