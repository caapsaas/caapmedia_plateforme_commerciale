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

    // Calculate operating income for display
    const operatingIncome = pnlData ? pnlData.grossProfit - pnlData.operatingExpenses : 0;
    
    // Loading state with modern skeleton
    if (!pnlData) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded-lg mb-6 w-1/3"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-6 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            {/* Header with application colors */}
            <div className="bg-gradient-to-r from-[#c6e911] to-[#adc40f] p-4 text-white">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3">
                    <div>
                        <h2 className="text-xl font-bold mb-1">{t('pnl.title')}</h2>
                        <div className="flex items-center gap-2 text-white/80">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                            <span className="text-xs">{subsidiary.name}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 no-print">
                        <div className="bg-white/20 backdrop-blur-sm rounded-md p-0.5">
                            <PeriodFilter 
                                period={period}
                                onPeriodChange={onPeriodChange}
                                startDate={startDate}
                                onStartDateChange={onStartDateChange}
                                endDate={endDate}
                                onEndDateChange={onEndDateChange}
                            />
                        </div>
                        <button 
                            onClick={handlePrint} 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 rounded-md font-medium text-xs border border-white/20"
                        >
                            <IconPrint className="h-3.5 w-3.5" />
                            <span>{t('common.print')}</span>
                        </button>
                        <button 
                            onClick={handleExportPdf} 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 rounded-md font-medium text-xs border border-white/20"
                        >
                            <IconPdf className="h-3.5 w-3.5" />
                            <span>{t('common.exportPdf')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue Column */}
                        <div className="bg-gradient-to-br from-slate-50 to-[#c6e911]/10 rounded-xl p-6 border border-[#c6e911]/20">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-[#c6e911] rounded-lg flex items-center justify-center">
                                    <div className="w-4 h-4 bg-white rounded"></div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">{t('pnl.revenue')}</h3>
                            </div>
                            
                            <div className="space-y-6">
                                {/* Revenue Detail */}
                                <div className="bg-white rounded-lg p-4 border border-[#c6e911]/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-5 h-5 bg-[#c6e911]/20 rounded-md flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-[#c6e911] rounded"></div>
                                        </div>
                                        <h4 className="font-semibold text-slate-700 text-sm">Total Revenue</h4>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 text-sm font-medium">Sales Income</span>
                                        <span className="text-xl font-bold text-[#c6e911]">{formatCurrency(pnlData.revenue)}</span>
                                    </div>
                                </div>

                                {/* Gross Profit */}
                                <div className="bg-gradient-to-r from-[#c6e911] to-[#adc40f] text-white rounded-lg p-4 shadow-md">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-white mb-1">Gross Profit</h4>
                                            <p className="text-white/90 text-xs">Revenue - COGS</p>
                                        </div>
                                        <div className="text-xl font-bold">{formatCurrency(pnlData.grossProfit)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expenses Column */}
                        <div className="bg-gradient-to-br from-slate-50 to-[#adc40f]/10 rounded-xl p-6 border border-[#adc40f]/20">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-[#adc40f] rounded-lg flex items-center justify-center">
                                    <div className="w-4 h-4 bg-white rounded"></div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">{t('pnl.expenses')}</h3>
                            </div>
                            
                            <div className="space-y-6">
                                {/* COGS Section */}
                                <div className="bg-white rounded-lg p-4 border border-[#adc40f]/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-5 h-5 bg-orange-100 rounded-md flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-orange-500 rounded"></div>
                                        </div>
                                        <h4 className="font-semibold text-slate-700 text-sm">{t('pnl.cogs')}</h4>
                                    </div>
                        <div className="flex justify-between items-center">
                                        <span className="text-slate-600 text-sm font-medium">Cost of Goods Sold</span>
                                        <span className="text-lg font-bold text-orange-600">({formatCurrency(pnlData.cogs)})</span>
                                    </div>
                                </div>

                                {/* Operating Expenses */}
                                <div className="bg-white rounded-lg p-4 border border-[#adc40f]/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-5 h-5 bg-red-100 rounded-md flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-red-500 rounded"></div>
                                        </div>
                                        <h4 className="font-semibold text-slate-700 text-sm">{t('pnl.operatingExpenses')}</h4>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 text-sm font-medium">Operating Costs</span>
                                        <span className="text-lg font-bold text-red-600">({formatCurrency(pnlData.operatingExpenses)})</span>
                                    </div>
                                </div>

                                {/* Taxes */}
                                <div className="bg-white rounded-lg p-4 border border-[#adc40f]/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-5 h-5 bg-slate-100 rounded-md flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-slate-500 rounded"></div>
                                        </div>
                                        <h4 className="font-semibold text-slate-700 text-sm">{t('pnl.taxes')}</h4>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 text-sm font-medium">Tax Expenses</span>
                                        <span className="text-lg font-bold text-slate-600">({formatCurrency(pnlData.taxes)})</span>
                                    </div>
                                </div>

                                {/* Total Expenses */}
                                <div className="bg-gradient-to-r from-[#adc40f] to-[#96900c] text-white rounded-lg p-4 shadow-md">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-white mb-1">Total Expenses</h4>
                                            <p className="text-white/90 text-xs">COGS + Operating + Taxes</p>
                                        </div>
                                        <div className="text-xl font-bold">{formatCurrency(pnlData.cogs + pnlData.operatingExpenses + pnlData.taxes)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net Income Section */}
                    <div className="mt-8 bg-gradient-to-r from-[#c6e911]/10 to-[#adc40f]/10 rounded-xl p-6 border border-[#c6e911]/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                    pnlData.netIncome >= 0 
                                        ? 'bg-[#c6e911]' 
                                        : 'bg-red-500'
                                }`}>
                                    <div className="w-6 h-6 bg-white rounded-full"></div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">{t('pnl.netIncome')}</h4>
                                    <p className="text-slate-600 text-sm">
                                        Gross Profit - Operating Expenses - Taxes
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-600 mb-1 font-medium">Net Result</div>
                                <div className={`text-2xl font-bold ${
                                    pnlData.netIncome >= 0 
                                        ? 'text-[#c6e911]' 
                                        : 'text-red-600'
                                }`}>
                                    {formatCurrency(pnlData.netIncome)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitAndLossStatement;
