import React, { useState, useMemo } from 'react';
import { Subsidiary, ExpenseRecord, ExpenseCategory, ExpenseType } from '../../types';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import ExpenseFormModal from './ExpenseFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';
import PeriodFilter from '../filters/PeriodFilter';
import SelectFilter from '../filters/SelectFilter';

interface ExpenseManagementProps {
    subsidiary: Subsidiary;
    expenseRecords: ExpenseRecord[];
}

const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ subsidiary, expenseRecords: allExpenseRecords }) => {
    const { t, formatCurrency } = useI18n();
    const [expenses, setExpenses] = useState(allExpenseRecords.filter(e => e.subsidiaryId === subsidiary.id));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
    const [deletingExpense, setDeletingExpense] = useState<ExpenseRecord | null>(null);

    // Filter states
    const [category, setCategory] = useState('');
    const [type, setType] = useState('');
    const [period, setPeriod] = useState('all_time');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredExpenses = useMemo(() => {
        let filtered = expenses;

        if (category) {
            filtered = filtered.filter(e => e.category === category);
        }
        if (type) {
            filtered = filtered.filter(e => e.type === type);
        }

        if (period !== 'all_time') {
            const now = new Date();
            let startPeriodDate = new Date();
            let endPeriodDate = new Date(now);

            if (period === 'custom' && startDate && endDate) {
                startPeriodDate = new Date(startDate);
                endPeriodDate = new Date(endDate);
                endPeriodDate.setHours(23, 59, 59, 999);
            } else {
                startPeriodDate.setHours(0, 0, 0, 0);
                switch (period) {
                    case 'seven_days': startPeriodDate.setDate(now.getDate() - 6); break;
                    case 'thirty_days': startPeriodDate.setDate(now.getDate() - 29); break;
                    case 'ninety_days': startPeriodDate.setDate(now.getDate() - 89); break;
                    case 'year': startPeriodDate = new Date(now.getFullYear(), 0, 1); break;
                }
            }
            
            filtered = filtered.filter(e => {
                const expenseDate = new Date(e.date);
                return expenseDate >= startPeriodDate && expenseDate <= endPeriodDate;
            });
        }
        
        return filtered;
    }, [expenses, category, type, period, startDate, endDate]);

    const totalExpenses = useMemo(() => filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0), [filteredExpenses]);

    const handleOpenAddModal = () => {
        setEditingExpense(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (expense: ExpenseRecord) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (expense: ExpenseRecord) => {
        setDeletingExpense(expense);
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setDeletingExpense(null);
    };

    const handleSaveExpense = (data: Omit<ExpenseRecord, 'id' | 'subsidiaryId'>) => {
        if (editingExpense) {
            setExpenses(prev => prev.map(e => e.id === editingExpense.id ? { ...editingExpense, ...data } : e));
        } else {
            const newExpense: ExpenseRecord = { ...data, id: `EXP${Date.now()}`, subsidiaryId: subsidiary.id };
            setExpenses(prev => [newExpense, ...prev]);
        }
        handleCloseModals();
    };

    const handleDeleteExpense = () => {
        if (deletingExpense) {
            setExpenses(prev => prev.filter(e => e.id !== deletingExpense.id));
            handleCloseModals();
        }
    };

    const handlePrint = () => window.print();

    const handleExportCsv = () => {
        const headers = [
            { key: 'date', label: t('expenses.table.date') },
            { key: 'description', label: t('expenses.table.description') },
            { key: 'category', label: t('expenses.table.category') },
            { key: 'type', label: t('expenses.table.type') },
            { key: 'amount', label: t('expenses.table.amount') },
        ];
        const data = filteredExpenses.map(e => ({
            ...e,
            category: t(`expenses.categories.${e.category}`),
            type: t(`expenses.types.${e.type}`),
        }));
        exportToCsv('liste_charges', headers, data);
    };
    
    const handleExportPdf = () => {
        const headers = [
            { key: 'date', label: t('expenses.table.date') },
            { key: 'description', label: t('expenses.table.description') },
            { key: 'category', label: t('expenses.table.category') },
            { key: 'type', label: t('expenses.table.type') },
            { key: 'amount', label: t('expenses.table.amount') },
        ];
        const data = filteredExpenses.map(e => ({
            ...e,
            category: t(`expenses.categories.${e.category}`),
            type: t(`expenses.types.${e.type}`),
            amount: formatCurrency(e.amount),
        }));
        exportToPdf(t('expenses.title'), headers, data, 'charges', 'l');
    };

    return (
        <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{t('expenses.title')}</h3>
                    <div className="flex items-center flex-wrap gap-2 no-print self-start md:self-center">
                        <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                            <IconPlus className="h-4 w-4" />
                            <span>{t('expenses.addExpense')}</span>
                        </button>
                        <button onClick={handlePrint} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                            <IconPrint className="h-4 w-4" />
                        </button>
                        <button onClick={handleExportCsv} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                            <IconExport className="h-4 w-4" />
                        </button>
                        <button onClick={handleExportPdf} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                            <IconPdf className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg no-print mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <SelectFilter name="category" label={t('expenses.filter.category')} value={category} onChange={e => setCategory(e.target.value)} options={Object.values(ExpenseCategory).map(c => ({value: c, label: t(`expenses.categories.${c}`)}))} placeholder={t('expenses.filter.allCategories')} />
                        <SelectFilter name="type" label={t('expenses.filter.type')} value={type} onChange={e => setType(e.target.value)} options={Object.values(ExpenseType).map(c => ({value: c, label: t(`expenses.types.${c}`)}))} placeholder={t('expenses.filter.allTypes')} />
                        <div className="lg:col-span-2">
                             <PeriodFilter period={period} onPeriodChange={e => setPeriod(e.target.value)} startDate={startDate} onStartDateChange={e => setStartDate(e.target.value)} endDate={endDate} onEndDateChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('expenses.table.date')}</th>
                                <th scope="col" className="px-6 py-3">{t('expenses.table.description')}</th>
                                <th scope="col" className="px-6 py-3">{t('expenses.table.category')}</th>
                                <th scope="col" className="px-6 py-3">{t('expenses.table.type')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('expenses.table.amount')}</th>
                                <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map((exp) => (
                                <tr key={exp.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4">{exp.date}</td>
                                    <td className="px-6 py-4 font-medium">{exp.description}</td>
                                    <td className="px-6 py-4">{t(`expenses.categories.${exp.category}`)}</td>
                                    <td className="px-6 py-4">{t(`expenses.types.${exp.type}`)}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{formatCurrency(exp.amount)}</td>
                                    <td className="px-6 py-4 text-center space-x-1 no-print">
                                        <button onClick={() => handleOpenEditModal(exp)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"><IconEdit className="h-5 w-5" /></button>
                                        <button onClick={() => handleOpenDeleteModal(exp)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"><IconDelete className="h-5 w-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold bg-slate-50">
                                <td colSpan={4} className="px-6 py-3 text-right">{t('expenses.totalExpenses')}</td>
                                <td className="px-6 py-3 text-right">{formatCurrency(totalExpenses)}</td>
                                <td className="px-6 py-3 no-print"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {isModalOpen && <ExpenseFormModal isOpen={isModalOpen} onClose={handleCloseModals} onSave={handleSaveExpense} expense={editingExpense} />}
            {deletingExpense && <ConfirmationModal isOpen={!!deletingExpense} onClose={handleCloseModals} onConfirm={handleDeleteExpense} title={t('expenses.modal.deleteTitle')} message={t('configuration.modal.deleteConfirmMessage', {itemName: deletingExpense.description})} />}
        </div>
    );
};

export default ExpenseManagement;