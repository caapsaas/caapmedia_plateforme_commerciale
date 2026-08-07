import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RecurringExpense, Subsidiary } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { deleteRecurringExpense, updateRecurringExpense } from '../../services/apiFinance/apiRecurringExpenses';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import IconPlus from '../icons/IconPlus';
import IconDelete from '../icons/IconDelete';
import ConfirmationModal from '../common/ConfirmationModal';
import RecurringExpenseModal from './RecurringExpenseModal';

interface RecurringExpensesProps {
    subsidiary: Subsidiary;
    recurringExpenses: RecurringExpense[];
    isLoading?: boolean;
}

// `expense.nextExecutionDate?.split('T')[0]` affichait l'ISO brut (ex:
// "2026-08-15") au lieu d'une date localisée — voir SupplierDebts.tsx.
const fmtDate = (date?: string | null, language = 'fr') => {
    if (!date) return '—';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(language);
};

const RecurringExpenses: React.FC<RecurringExpensesProps> = ({ subsidiary, recurringExpenses: allExpenses, isLoading = false }) => {
    const { t, formatCurrency, language } = useI18n();
    const toast = useToast();
    const queryClient = useQueryClient();
    const expenses = allExpenses.filter(e => e.subsidiaryId === subsidiary.id);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deletingExpense, setDeletingExpense] = useState<RecurringExpense | null>(null);

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['recurringExpenses', subsidiary.id] });

    const { mutate: toggleActive } = useMutation({
        mutationFn: (expense: RecurringExpense) => updateRecurringExpense(expense.id, { isActive: !expense.isActive }),
        onSuccess: () => {
            invalidate();
            toast.success(t('recurringExpenses.updateSuccess'), t('recurringExpenses.updateSuccessMessage'));
        },
        onError: (error: any) => {
            toast.error(t('recurringExpenses.updateError'), error?.response?.data?.message || t('recurringExpenses.updateErrorMessage'));
        },
    });

    const { mutate: remove } = useMutation({
        mutationFn: (id: string) => deleteRecurringExpense(id),
        onSuccess: () => {
            invalidate();
            toast.success(t('recurringExpenses.deleteSuccess'), t('recurringExpenses.deleteSuccessMessage'));
            setDeletingExpense(null);
        },
        onError: (error: any) => {
            toast.error(t('recurringExpenses.deleteError'), error?.response?.data?.message || t('recurringExpenses.deleteErrorMessage'));
        },
    });

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{t('recurringExpenses.title')}</h3>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center space-x-2 px-3 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors no-print"
                    >
                        <IconPlus className="h-4 w-4" />
                        <span>{t('recurringExpenses.addExpense')}</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('recurringExpenses.table.description')}</th>
                                <th scope="col" className="px-6 py-3">{t('recurringExpenses.table.category')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('recurringExpenses.table.amount')}</th>
                                <th scope="col" className="px-6 py-3">{t('recurringExpenses.table.frequency')}</th>
                                <th scope="col" className="px-6 py-3">{t('recurringExpenses.table.nextExecutionDate')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('recurringExpenses.table.status')}</th>
                                <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <TableSkeleton rows={5} columns={7} />
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <EmptyState icon="finance" title={t('recurringExpenses.title')} description={t('common.notAvailable')} />
                                    </td>
                                </tr>
                            ) : expenses.map((expense) => (
                                <tr key={expense.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{expense.description}</td>
                                    <td className="px-6 py-4">{t(`expenses.categories.${expense.category}`)}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{formatCurrency(expense.amount)}</td>
                                    <td className="px-6 py-4">{t(`recurringExpenses.frequency.${expense.frequency}`)}</td>
                                    <td className="px-6 py-4">{fmtDate(expense.nextExecutionDate, language)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${expense.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                                            {expense.isActive ? t('recurringExpenses.statusActive') : t('recurringExpenses.statusPaused')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center no-print space-x-1">
                                        <button
                                            onClick={() => toggleActive(expense)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                                expense.isActive
                                                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                            }`}
                                        >
                                            {expense.isActive ? t('recurringExpenses.pause') : t('recurringExpenses.resume')}
                                        </button>
                                        <button
                                            onClick={() => setDeletingExpense(expense)}
                                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                            title={t('common.delete')}
                                        >
                                            <IconDelete className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <RecurringExpenseModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                subsidiaryId={subsidiary.id}
            />
            <ConfirmationModal
                isOpen={!!deletingExpense}
                onClose={() => setDeletingExpense(null)}
                onConfirm={() => deletingExpense && remove(deletingExpense.id)}
                title={t('recurringExpenses.deleteConfirmTitle')}
                message={t('recurringExpenses.deleteConfirmMessage')}
            />
        </div>
    );
};

export default RecurringExpenses;
