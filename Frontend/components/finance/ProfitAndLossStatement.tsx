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
    subsidiary, pnlData, period, onPeriodChange, startDate, onStartDateChange, endDate, onEndDateChange,
}) => {
    const { t, formatCurrency } = useI18n();

    const handlePrint = () => window.print();
    const handleExportPdf = () => alert('PDF export for P&L is a planned feature.');

    if (!pnlData) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse">
                <div className="h-7 bg-slate-100 rounded-lg mb-6 w-1/3" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-5 bg-slate-100 rounded-lg" />)}
                </div>
            </div>
        );
    }

    const profitBeforeTax = pnlData.grossProfit - pnlData.operatingExpenses;
    const isProfit = pnlData.netIncome >= 0;

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

            {/* En-tête */}
            <div className="bg-gradient-to-r from-[#c6e911] to-[#adc40f] px-6 py-4">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{t('pnl.title')}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                            <span className="text-sm text-slate-700 font-medium">{subsidiary.name}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 no-print">
                        <div className="bg-white/40 rounded-lg p-0.5">
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
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/40 text-slate-800 hover:bg-white/60 transition-colors rounded-lg text-xs font-semibold border border-slate-800/10"
                        >
                            <IconPrint className="h-3.5 w-3.5" />
                            {t('common.print')}
                        </button>
                        <button
                            onClick={handleExportPdf}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/40 text-slate-800 hover:bg-white/60 transition-colors rounded-lg text-xs font-semibold border border-slate-800/10"
                        >
                            <IconPdf className="h-3.5 w-3.5" />
                            {t('common.exportPdf')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Corps */}
            <div className="p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Colonne revenus */}
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                            <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                                <span className="w-2 h-5 bg-[#c6e911] rounded-full inline-block" />
                                {t('pnl.revenue')}
                            </h3>

                            <div className="space-y-3">
                                {/* Chiffre d'affaires */}
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                        {t('pnl.revenue')}
                                    </p>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-sm text-slate-600">Ventes</span>
                                        <span className="text-xl font-bold text-slate-800">{formatCurrency(pnlData.revenue)}</span>
                                    </div>
                                </div>

                                {/* Bénéfice brut */}
                                <div className="bg-slate-800 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-white text-sm">Bénéfice brut</p>
                                            <p className="text-slate-400 text-xs mt-0.5">CA − Coût des ventes</p>
                                        </div>
                                        <span className="text-xl font-bold text-[#c6e911]">{formatCurrency(pnlData.grossProfit)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Colonne charges */}
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                            <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                                <span className="w-2 h-5 bg-red-400 rounded-full inline-block" />
                                {t('pnl.expenses')}
                            </h3>

                            <div className="space-y-3">
                                {[
                                    { label: t('pnl.cogs'),               value: pnlData.cogs,               color: 'text-orange-600', note: 'Coût des marchandises' },
                                    { label: t('pnl.operatingExpenses'),  value: pnlData.operatingExpenses,  color: 'text-red-600',    note: 'Charges exploitation' },
                                    { label: t('pnl.taxes'),              value: pnlData.taxes,              color: 'text-slate-600',  note: 'Charges fiscales' },
                                    { label: 'Résultat avant impôts',     value: profitBeforeTax,            color: 'text-blue-600',   note: 'Bénéfice brut − charges' },
                                ].map(({ label, value, color, note }) => (
                                    <div key={label} className="bg-white rounded-lg p-4 border border-slate-200">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-xs text-slate-400">{note}</span>
                                            <span className={`text-base font-bold ${color}`}>
                                                {label === 'Résultat avant impôts' ? formatCurrency(value) : `(${formatCurrency(value)})`}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {/* Total charges */}
                                <div className="bg-slate-800 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-white text-sm">Total des charges</p>
                                            <p className="text-slate-400 text-xs mt-0.5">Coûts + exploitation + taxes</p>
                                        </div>
                                        <span className="text-xl font-bold text-red-400">
                                            ({formatCurrency(pnlData.cogs + pnlData.operatingExpenses + pnlData.taxes)})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Résultat net */}
                    <div className={`mt-6 rounded-xl p-6 border-2 ${isProfit ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-base font-bold text-slate-800">{t('pnl.netIncome')}</h4>
                                <p className="text-sm text-slate-500 mt-0.5">Résultat avant impôts − Taxes</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 mb-1">Résultat net</p>
                                <p className={`text-3xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(pnlData.netIncome)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitAndLossStatement;
