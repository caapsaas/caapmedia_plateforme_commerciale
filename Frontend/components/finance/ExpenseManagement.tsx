import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Subsidiary, ExpenseRecord, ExpenseCategory, ExpenseStatus, ExpenseType } from '../../types';
import {
    saveExpense,
    deleteExpense,
    confirmExpenseInvoice,
    approveExpense,
    rejectExpense,
    uploadExpenseProof,
} from '../../services/apiFinance/apiExpense';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
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
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import { getPresetPeriodDates, toLocalDateKey } from '../../utils/datePeriods';
import Pagination from '../common/Pagination';
import { useClientPagination } from '../../hooks/useClientPagination';

interface ExpenseManagementProps {
    subsidiary: Subsidiary;
    expenseRecords: ExpenseRecord[];
    isLoading?: boolean;
}

const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ subsidiary, expenseRecords: allExpenseRecords, isLoading = false }) => {
    const { user } = useAuth();
    const activeRole = user?.activeRole ?? user?.userRole;
    const canManage = activeRole === UserRole.ADMIN || activeRole === UserRole.FINANCIAL_DIRECTOR;
    const { t, formatCurrency } = useI18n();
    const toast = useToast();
    const queryClient = useQueryClient();
    const expenses = useMemo(() => allExpenseRecords.filter(e => e.subsidiaryId === subsidiary.id), [allExpenseRecords, subsidiary.id]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
    const [deletingExpense, setDeletingExpense] = useState<ExpenseRecord | null>(null);
    const [invoiceConfirmTarget, setInvoiceConfirmTarget] = useState<ExpenseRecord | null>(null);
    const [confirmedInvoiceAmount, setConfirmedInvoiceAmount] = useState('');
    const [rejectTarget, setRejectTarget] = useState<ExpenseRecord | null>(null);
    const [rejectReason, setRejectReason] = useState('');

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
            const range = period === 'custom' ? { startDate, endDate } : getPresetPeriodDates(period);
            filtered = filtered.filter(e => {
                const expenseDate = toLocalDateKey(new Date(e.date));
                return (!range.startDate || expenseDate >= range.startDate) && (!range.endDate || expenseDate <= range.endDate);
            });
        }
        
        return filtered;
    }, [expenses, category, type, period, startDate, endDate]);
    const { pageItems: pageExpenses, meta: expensesMeta, setPage } = useClientPagination(filteredExpenses, 10);

    const updateFilter = (setFilter: (value: string) => void) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilter(event.target.value);
        setPage(1);
    };

    const totalExpenses = useMemo(() => filteredExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0), [filteredExpenses]);

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

    const handleSaveExpense = async (data: Omit<ExpenseRecord, 'id' | 'subsidiaryId'>) => {
        try {
            if (editingExpense) {
                await saveExpense({ ...data, id: editingExpense.id });
                toast.success('Dépense modifiée!', 'La dépense a été modifiée avec succès.');
            } else {
                await saveExpense(data);
                toast.success('Dépense ajoutée!', 'La dépense a été ajoutée avec succès.');
            }
            void queryClient.invalidateQueries({ queryKey: ['expenseRecords'] });
            void queryClient.invalidateQueries({ queryKey: ['payableExpenses'] });
            handleCloseModals();
        } catch (error) {
            toast.error('Erreur de sauvegarde', 'Une erreur est survenue lors de la sauvegarde de la dépense.');
        }
    };

    const handleDeleteExpense = async () => {
        try {
            if (deletingExpense) {
                await deleteExpense(deletingExpense.id);
                void queryClient.invalidateQueries({ queryKey: ['expenseRecords'] });
                void queryClient.invalidateQueries({ queryKey: ['payableExpenses'] });
                toast.success('Dépense supprimée!', 'La dépense a été supprimée avec succès.');
                handleCloseModals();
            }
        } catch (error) {
            toast.error('Erreur de suppression', 'Une erreur est survenue lors de la suppression de la dépense.');
        }
    };

    const refreshExpenses = () => {
        void queryClient.invalidateQueries({ queryKey: ['expenseRecords'] });
        void queryClient.invalidateQueries({ queryKey: ['payableExpenses'] });
    };

    const handleApproveExpense = async (id: string) => {
        try {
            await approveExpense(id);
            refreshExpenses();
            toast.success(t('expenses.workflow.approveSuccess'));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || t('common.error'));
        }
    };

    const handleConfirmInvoiceSubmit = async () => {
        if (!invoiceConfirmTarget) return;
        const val = parseFloat(confirmedInvoiceAmount);
        if (!Number.isFinite(val) || val <= 0) return;
        try {
            await confirmExpenseInvoice(invoiceConfirmTarget.id, { amount: val });
            refreshExpenses();
            setInvoiceConfirmTarget(null);
            setConfirmedInvoiceAmount('');
            toast.success(t('expenses.workflow.confirmInvoiceSuccess'));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || t('common.error'));
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectTarget || rejectReason.trim().length < 3) return;
        try {
            await rejectExpense(rejectTarget.id, rejectReason.trim());
            refreshExpenses();
            setRejectTarget(null);
            setRejectReason('');
            toast.success(t('expenses.workflow.rejectSuccess'));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || t('common.error'));
        }
    };

    const handleUploadProof = async (id: string, file: File) => {
        try {
            await uploadExpenseProof(id, file);
            refreshExpenses();
            toast.success(t('treasury.trace.proofSuccess'));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || t('common.error'));
        }
    };

    const handlePrint = () => {
        window.print();
        toast.info('Impression lancée', 'La page est en cours d\'impression.');
    };

    const handleExportCsv = () => {
        try {
            const headers = [
                { key: 'date', label: t('expenses.table.date') },
                { key: 'description', label: t('expenses.table.description') },
                { key: 'category', label: t('expenses.table.category') },
                { key: 'type', label: t('expenses.table.type') },
                { key: 'amount', label: t('expenses.table.amount') },
            ];
            const data = filteredExpenses.map(e => ({
                ...e,
                category: t(`expenses.categories.${e.category || 'OTHER'}`),
                type: t(`expenses.types.${e.type || 'VARIABLE'}`),
            }));
            exportToCsv('liste_charges', headers, data);
            toast.success('Export CSV réussi!', 'Les données ont été exportées au format CSV.');
        } catch (error) {
            toast.error('Erreur d\'export', 'Une erreur est survenue lors de l\'export CSV.');
        }
    };
    
    const handleExportPdf = () => {
        try {
            const headers = [
                { key: 'date', label: t('expenses.table.date') },
                { key: 'description', label: t('expenses.table.description') },
                { key: 'category', label: t('expenses.table.category') },
                { key: 'type', label: t('expenses.table.type') },
                { key: 'amount', label: t('expenses.table.amount') },
            ];
            const data = filteredExpenses.map(e => ({
                ...e,
                category: t(`expenses.categories.${e.category || 'OTHER'}`),
                type: t(`expenses.types.${e.type || 'VARIABLE'}`),
                amount: formatCurrency(e.amount),
            }));
            exportToPdf(t('expenses.title'), headers, data, 'charges', 'l');
            toast.success('Export PDF réussi!', 'Les données ont été exportées au format PDF.');
        } catch (error) {
            toast.error('Erreur d\'export', 'Une erreur est survenue lors de l\'export PDF.');
        }
    };

    return (
        <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{t('expenses.title')}</h3>
                    <div className="flex items-center flex-wrap gap-2 no-print self-start md:self-center">
                        {canManage && (<button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                            <IconPlus className="h-4 w-4" />
                            <span>{t('expenses.addExpense')}</span>
                        </button>)}
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
                        <SelectFilter name="category" label={t('expenses.filter.category')} value={category} onChange={updateFilter(setCategory)} options={Object.values(ExpenseCategory).map(c => ({value: c, label: t(`expenses.categories.${c}`)}))} placeholder={t('expenses.filter.allCategories')} />
                        <SelectFilter name="type" label={t('expenses.filter.type')} value={type} onChange={updateFilter(setType)} options={Object.values(ExpenseType).map(c => ({value: c, label: t(`expenses.types.${c}`)}))} placeholder={t('expenses.filter.allTypes')} />
                        <div className="lg:col-span-2">
                             <PeriodFilter period={period} onPeriodChange={updateFilter(next => {
                                 setPeriod(next);
                                 if (next !== 'custom') {
                                     setStartDate('');
                                     setEndDate('');
                                 }
                             })} startDate={startDate} onStartDateChange={updateFilter(setStartDate)} endDate={endDate} onEndDateChange={updateFilter(setEndDate)} />
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
                                <th scope="col" className="px-6 py-3">{t('expenses.table.workflowStatus')}</th>
                                <th scope="col" className="px-6 py-3">{t('needs.paymentStatus')}</th>
                                <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <TableSkeleton rows={8} columns={8} />
                            ) : filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={8}>
                                        <EmptyState icon="finance" title={t('expenses.title')} description={t('common.notAvailable')} />
                                    </td>
                                </tr>
                            ) : pageExpenses.map((exp) => {
                                const workflowStatus = exp.status ?? (exp.paymentTransaction ? ExpenseStatus.PAID : ExpenseStatus.APPROVED);
                                const statusBadge =
                                    workflowStatus === ExpenseStatus.PENDING_INVOICE ? 'bg-amber-100 text-amber-800' :
                                    workflowStatus === ExpenseStatus.DRAFT ? 'bg-slate-100 text-slate-700' :
                                    workflowStatus === ExpenseStatus.APPROVED ? 'bg-blue-100 text-blue-800' :
                                    workflowStatus === ExpenseStatus.REJECTED ? 'bg-rose-100 text-rose-800' :
                                    'bg-green-100 text-green-800';
                                return (
                                <tr key={exp.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4">{exp.date ? new Date(exp.date).toLocaleDateString('fr-FR') : ''}</td>
                                    <td className="px-6 py-4 font-medium">{exp.description}</td>
                                    <td className="px-6 py-4">{t(`expenses.categories.${exp.category || 'OTHER'}`)}</td>
                                    <td className="px-6 py-4">{t(`expenses.types.${exp.type || 'VARIABLE'}`)}</td>
                                    <td className="px-6 py-4 text-right font-semibold tabular-nums">{formatCurrency(Number(exp.amount))}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge}`}>
                                            {t(`expenses.status.${workflowStatus}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {exp.paymentTransaction ? (
                                            <>
                                                <span className="font-semibold text-green-700">{t('needs.paid')}</span>
                                                <div className="text-xs">{exp.paymentTransaction.treasuryAccount.accountName}</div>
                                            </>
                                        ) : t('needs.unpaid')}
                                    </td>
                                    <td className="px-6 py-4 text-center space-x-1 no-print">
                                        {canManage && workflowStatus === ExpenseStatus.PENDING_INVOICE && (
                                            <button
                                                onClick={() => { setInvoiceConfirmTarget(exp); setConfirmedInvoiceAmount(''); }}
                                                className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded hover:bg-amber-200"
                                            >
                                                {t('expenses.workflow.confirmInvoiceBtn')}
                                            </button>
                                        )}
                                        {canManage && workflowStatus === ExpenseStatus.DRAFT && (
                                            <>
                                                <button
                                                    onClick={() => handleApproveExpense(exp.id)}
                                                    className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                                >
                                                    {t('expenses.workflow.approveBtn')}
                                                </button>
                                                <button
                                                    onClick={() => { setRejectTarget(exp); setRejectReason(''); }}
                                                    className="px-2 py-1 text-xs font-semibold bg-rose-100 text-rose-800 rounded hover:bg-rose-200"
                                                >
                                                    {t('expenses.workflow.rejectBtn')}
                                                </button>
                                            </>
                                        )}
                                        {canManage && !exp.paymentTransaction && (
                                            <>
                                                <label className="inline-block cursor-pointer px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded hover:bg-slate-200" title={t('treasury.trace.uploadProof')}>
                                                    PDF
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const f = e.target.files?.[0];
                                                            if (f) handleUploadProof(exp.id, f);
                                                        }}
                                                    />
                                                </label>
                                                <button onClick={() => handleOpenEditModal(exp)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"><IconEdit className="h-5 w-5" /></button>
                                                <button onClick={() => handleOpenDeleteModal(exp)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"><IconDelete className="h-5 w-5" /></button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold bg-slate-50">
                                <td colSpan={4} className="px-6 py-3 text-right">{t('expenses.totalExpenses')}</td>
                                <td className="px-6 py-3 text-right tabular-nums">{formatCurrency(totalExpenses)}</td>
                                <td />
                                <td />
                                <td className="px-6 py-3 no-print"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <Pagination meta={expensesMeta} onPageChange={setPage} />
            </div>

            {isModalOpen && <ExpenseFormModal isOpen={isModalOpen} onClose={handleCloseModals} onSave={handleSaveExpense} expense={editingExpense} />}
            {deletingExpense && <ConfirmationModal isOpen={!!deletingExpense} onClose={handleCloseModals} onConfirm={handleDeleteExpense} title={t('expenses.modal.deleteTitle')} message={t('configuration.modal.deleteConfirmMessage', {itemName: deletingExpense.description})} />}
            {invoiceConfirmTarget && (
                <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4" onClick={() => setInvoiceConfirmTarget(null)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-800">{t('expenses.workflow.confirmInvoiceTitle')}</h3>
                        <p className="text-sm text-slate-600">{invoiceConfirmTarget.description}</p>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={confirmedInvoiceAmount}
                            onChange={(e) => setConfirmedInvoiceAmount(e.target.value)}
                            placeholder="Montant réel (FCFA)"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setInvoiceConfirmTarget(null)} className="px-4 py-2 text-sm bg-slate-200 rounded-md">{t('common.cancel')}</button>
                            <button onClick={handleConfirmInvoiceSubmit} className="px-4 py-2 text-sm font-semibold bg-[#c6e911] text-slate-900 rounded-md">{t('common.save')}</button>
                        </div>
                    </div>
                </div>
            )}
            {rejectTarget && (
                <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4" onClick={() => setRejectTarget(null)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-800">{t('expenses.workflow.rejectTitle')}</h3>
                        <p className="text-sm text-slate-600">{rejectTarget.description}</p>
                        <textarea
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder={t('expenses.workflow.rejectPlaceholder')}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setRejectTarget(null)} className="px-4 py-2 text-sm bg-slate-200 rounded-md">{t('common.cancel')}</button>
                            <button onClick={handleRejectSubmit} disabled={rejectReason.trim().length < 3} className="px-4 py-2 text-sm font-semibold bg-rose-600 text-white rounded-md disabled:opacity-50">{t('expenses.workflow.rejectBtn')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseManagement;
