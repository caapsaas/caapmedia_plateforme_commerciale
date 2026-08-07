import React, { useState } from 'react';
import { LongTermDebt, Subsidiary } from '../../types';
import { useI18n } from '../../i18n';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import LongTermDebtModal from './LongTermDebtModal';

interface LongTermDebtsProps {
    subsidiary: Subsidiary;
    longTermDebts: LongTermDebt[];
    isLoading?: boolean;
}

// `debt.maturityDate?.split('T')[0]` affichait l'ISO brut (ex: "2026-08-15")
// au lieu d'une date localisée — voir le même correctif sur SupplierDebts.tsx.
const fmtDate = (date?: string | null, language = 'fr') => {
    if (!date) return '—';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(language);
};

const LongTermDebts: React.FC<LongTermDebtsProps> = ({ subsidiary, longTermDebts: allDebts, isLoading = false }) => {
    const { t, formatCurrency, language } = useI18n();
    const debts = allDebts.filter(d => d.subsidiaryId === subsidiary.id);
    const totalBalance = debts.reduce((acc, d) => acc + Number(d.currentBalance), 0);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [debtToEdit, setDebtToEdit] = useState<LongTermDebt | null>(null);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-md">
                    <h4 className="font-semibold text-slate-500">{t('supplierDebts.longTerm.currentBalance')}</h4>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{formatCurrency(totalBalance)}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{t('supplierDebts.longTerm.title')}</h3>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center space-x-2 px-3 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors no-print"
                    >
                        <IconPlus className="h-4 w-4" />
                        <span>{t('supplierDebts.longTerm.addDebt')}</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('supplierDebts.longTerm.name')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('supplierDebts.longTerm.initialAmount')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('supplierDebts.longTerm.currentBalance')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('supplierDebts.longTerm.interestRate')}</th>
                                <th scope="col" className="px-6 py-3">{t('supplierDebts.longTerm.maturityDate')}</th>
                                <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <TableSkeleton rows={5} columns={6} />
                            ) : debts.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState icon="truck" title={t('supplierDebts.longTerm.title')} description={t('common.notAvailable')} />
                                    </td>
                                </tr>
                            ) : debts.map((debt) => (
                                <tr key={debt.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{debt.debtsName}</td>
                                    <td className="px-6 py-4 text-right">{formatCurrency(debt.initialAmount)}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{formatCurrency(debt.currentBalance)}</td>
                                    <td className="px-6 py-4 text-right">{debt.interestRate}%</td>
                                    <td className="px-6 py-4">{fmtDate(debt.maturityDate, language)}</td>
                                    <td className="px-6 py-4 text-center no-print">
                                        <button
                                            onClick={() => setDebtToEdit(debt)}
                                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                            title={t('common.edit')}
                                        >
                                            <IconEdit className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <LongTermDebtModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                subsidiaryId={subsidiary.id}
                debtToEdit={null}
            />
            <LongTermDebtModal
                isOpen={!!debtToEdit}
                onClose={() => setDebtToEdit(null)}
                subsidiaryId={subsidiary.id}
                debtToEdit={debtToEdit}
            />
        </div>
    );
};

export default LongTermDebts;
