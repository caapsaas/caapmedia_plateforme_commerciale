import React, { useState, useEffect } from 'react';
import { ExternalFinancialTransaction, ExternalTransactionType, ExternalTransactionCategory, ExternalTransactionStatus, PaymentMethod, Subsidiary, UserRole } from '../../types/models';
import { getExternalTransactions, createExternalTransaction, updateExternalTransaction, validateExternalTransaction, cancelExternalTransaction, deleteExternalTransaction, getExternalTransactionStatistics, ExternalTransactionFilters, ExternalTransactionStatistics, CreateExternalTransactionData } from '../../services/apiFinance/apiExternalTransactions';
import { getPrefinancementAccount, getPrefinancementStatistics } from '../../services/apiFinance/apiPrefinancement';
import { useAuth } from '../../context/AuthContext';
import { useHasRole } from '../../hooks/useHasRole';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { exportToCSV, formatAmount, calculateTotals } from '../../utils/exportUtils';
import EmptyState from '../ui/EmptyState';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
  }
}

interface ExternalTransactionsProps {
  subsidiary: Subsidiary;
}

const STATUS_STYLES: Record<ExternalTransactionStatus, string> = {
  [ExternalTransactionStatus.DRAFT]:     'bg-amber-100 text-amber-800',
  [ExternalTransactionStatus.VALIDATED]: 'bg-green-100 text-green-800',
  [ExternalTransactionStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

const ExternalTransactions: React.FC<ExternalTransactionsProps> = ({ subsidiary }) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { hasRole } = useHasRole();
  const { toast } = useToast();

  const canCreate  = hasRole([UserRole.SUPER_ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.ADMIN]);
  const canValidate = hasRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR]);

  if (!canCreate && !canValidate) {
    return (
      <div className="p-6 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-amber-800 mb-1">{t('common.accessDenied')}</h3>
          <p className="text-sm text-amber-700">{t('externalTransactions.accessDenied')}</p>
        </div>
      </div>
    );
  }

  const [transactions, setTransactions] = useState<ExternalFinancialTransaction[]>([]);
  const [statistics, setStatistics] = useState<ExternalTransactionStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ExternalFinancialTransaction | null>(null);
  const [filters, setFilters] = useState<ExternalTransactionFilters>({});

  const [formData, setFormData] = useState({
    transactionDate: '',
    description: '',
    amount: '',
    externalTransactionType: ExternalTransactionType.OTHER_FINANCIAL,
    externalTransactionCategory: ExternalTransactionCategory.OTHER,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    referenceNumber: '',
  });
  const [customCategory, setCustomCategory] = useState('');
  const [customTransactionType, setCustomTransactionType] = useState('');
  const [fileUpload, setFileUpload] = useState<File | null>(null);

  useEffect(() => { loadData(); }, [subsidiary.id, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, statisticsData] = await Promise.all([
        getExternalTransactions(subsidiary.id, filters),
        getExternalTransactionStatistics(subsidiary.id),
      ]);

      try {
        await getPrefinancementAccount(subsidiary.id);
        await getPrefinancementStatistics(subsidiary.id);
      } catch {
        // Compte financement inexistant — pas d'action requise
      }

      setTransactions(transactionsData);
      setStatistics(statisticsData);
    } catch {
      toast('error', t('externalTransactions.error.loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const amountValue = parseFloat(formData.amount);
      if (isNaN(amountValue) || amountValue <= 0) { toast('error', t('externalTransactions.error.invalidAmount')); return; }
      if (!formData.transactionDate) { toast('error', t('externalTransactions.error.invalidDate')); return; }
      if (isNaN(new Date(formData.transactionDate).getTime())) { toast('error', t('externalTransactions.error.invalidDate')); return; }
      if (!formData.description.trim()) { toast('error', t('externalTransactions.error.invalidDescription')); return; }

      let finalDescription = formData.description.trim();
      if (formData.externalTransactionType === ExternalTransactionType.OTHER_FINANCIAL && customTransactionType.trim()) {
        finalDescription = `[${customTransactionType.trim()}] ${finalDescription}`;
      }

      const createData: CreateExternalTransactionData = {
        transactionDate: new Date(formData.transactionDate).toISOString().split('T')[0],
        description: finalDescription,
        amount: amountValue,
        externalTransactionType: formData.externalTransactionType,
        externalTransactionCategory: formData.externalTransactionCategory,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber?.trim() || undefined,
        createdBy: user!.id,
        subsidiaryId: subsidiary.id,
      };

      await createExternalTransaction(createData);
      setShowCreateModal(false);
      resetForm();
      loadData();
      toast('success', t('externalTransactions.success.created'));
    } catch (error: any) {
      const errorData = error?.response?.data;
      if (error?.response?.status === 400 && errorData) {
        const msg = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : String(errorData.message ?? errorData.error ?? 'Données invalides').slice(0, 200);
        toast('error', `Erreur de validation : ${msg}`);
      } else {
        toast('error', t('externalTransactions.error.create'));
      }
    }
  };

  const handleUpdate = async () => {
    if (!selectedTransaction) return;
    try {
      let finalDescription = formData.description.trim();
      if (formData.externalTransactionType === ExternalTransactionType.OTHER_FINANCIAL && customTransactionType.trim()) {
        finalDescription = `[${customTransactionType.trim()}] ${finalDescription}`;
      }
      await updateExternalTransaction(selectedTransaction.id, {
        transactionDate: formData.transactionDate,
        description: finalDescription,
        amount: parseFloat(formData.amount),
        externalTransactionType: formData.externalTransactionType,
        externalTransactionCategory: formData.externalTransactionCategory,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || undefined,
      });
      toast('success', t('externalTransactions.success.updated'));
      setShowEditModal(false);
      setSelectedTransaction(null);
      resetForm();
      loadData();
    } catch {
      toast('error', t('externalTransactions.error.update'));
    }
  };

  const handleValidate = async (id: string) => {
    try { await validateExternalTransaction(id); loadData(); toast('success', t('externalTransactions.success.validated')); }
    catch { toast('error', t('externalTransactions.error.validate')); }
  };

  const handleCancel = async (id: string) => {
    try { await cancelExternalTransaction(id); loadData(); toast('success', t('externalTransactions.success.cancelled')); }
    catch { toast('error', t('externalTransactions.error.cancel')); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('externalTransactions.confirm.delete'))) return;
    try { await deleteExternalTransaction(id); loadData(); toast('success', t('externalTransactions.success.deleted')); }
    catch { toast('error', t('externalTransactions.error.delete')); }
  };

  const handleAdminDelete = async (id: string) => {
    if (!window.confirm(t('externalTransactions.confirm.adminDelete'))) return;
    try { await deleteExternalTransaction(id); loadData(); toast('success', t('externalTransactions.success.adminDeleted')); }
    catch { toast('error', t('externalTransactions.error.adminDelete')); }
  };

  const resetForm = () => {
    setFormData({
      transactionDate: '',
      description: '',
      amount: '',
      externalTransactionType: ExternalTransactionType.OTHER_FINANCIAL,
      externalTransactionCategory: ExternalTransactionCategory.OTHER,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      referenceNumber: '',
    });
    setCustomCategory('');
    setCustomTransactionType('');
    setFileUpload(null);
  };

  const openEditModal = (transaction: ExternalFinancialTransaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      transactionDate: transaction.transactionDate.split('T')[0],
      description: transaction.description,
      amount: transaction.amount.toString(),
      externalTransactionType: transaction.externalTransactionType,
      externalTransactionCategory: transaction.externalTransactionCategory,
      paymentMethod: transaction.paymentMethod,
      referenceNumber: transaction.referenceNumber || '',
    });
    setShowEditModal(true);
  };

  const isCredit = (type: ExternalTransactionType, category?: ExternalTransactionCategory) =>
    type === ExternalTransactionType.TRANSFER_PDG && category === ExternalTransactionCategory.TRANSFER_PDG;

  const handleExportCSV = () => {
    exportToCSV(transactions, `${t('externalTransactions.title')}_${subsidiary.name}_${new Date().toISOString().split('T')[0]}`);
    toast('success', t('externalTransactions.success.exported'));
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${t('externalTransactions.title')} - ${subsidiary.name}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Date : ${new Date().toLocaleDateString()}`, 14, 32);

    autoTable(doc, {
      head: [[
        t('externalTransactions.table.date'),
        t('externalTransactions.table.description'),
        t('externalTransactions.table.amount'),
        t('externalTransactions.table.type'),
        t('externalTransactions.table.category'),
        t('externalTransactions.table.status'),
        t('externalTransactions.table.reference'),
      ]],
      body: transactions.map(tx => [
        new Date(tx.transactionDate).toLocaleDateString(),
        tx.description,
        formatAmount(tx.amount),
        t(`externalTransactions.types.${tx.externalTransactionType}`),
        t(`externalTransactions.categories.${tx.externalTransactionCategory}`),
        t(`externalTransactions.status.${tx.status}`),
        tx.referenceNumber || '',
      ]),
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [198, 233, 17], textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    const totals = calculateTotals(transactions);
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(11);
    doc.text(`Total : ${transactions.length} transactions`, 14, finalY + 10);
    doc.text(`Entrées : ${formatAmount(totals.totalIncome)}`, 14, finalY + 20);
    doc.text(`Sorties : ${formatAmount(totals.totalExpenses)}`, 14, finalY + 30);
    doc.text(`Net : ${formatAmount(totals.netAmount)}`, 14, finalY + 40);

    doc.save(`${t('externalTransactions.title')}_${subsidiary.name}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast('success', t('externalTransactions.success.exported'));
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedTransaction(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse">
              <div className="h-3 w-24 bg-slate-100 rounded mb-3" />
              <div className="h-7 w-16 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Statistiques */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">{t('externalTransactions.stats.total')}</p>
            <p className="text-2xl font-bold text-slate-800">{statistics.totalTransactions}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">{t('externalTransactions.stats.totalAmount')}</p>
            <p className="text-2xl font-bold text-slate-800">{formatAmount(statistics.totalAmount)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">{t('externalTransactions.stats.validated')}</p>
            <p className="text-2xl font-bold text-green-600">
              {statistics.transactionsByStatus.find(s => s.status === ExternalTransactionStatus.VALIDATED)?.count ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">{t('externalTransactions.stats.pending')}</p>
            <p className="text-2xl font-bold text-amber-500">
              {statistics.transactionsByStatus.find(s => s.status === ExternalTransactionStatus.DRAFT)?.count ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* Filtres + actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              {
                value: filters.type || '',
                onChange: (v: string) => setFilters({ ...filters, type: v || undefined }),
                placeholder: t('externalTransactions.filters.allTypes'),
                options: Object.values(ExternalTransactionType).map(type => ({
                  value: type, label: t(`externalTransactions.types.${type}`),
                })),
              },
              {
                value: filters.status || '',
                onChange: (v: string) => setFilters({ ...filters, status: v as ExternalTransactionStatus || undefined }),
                placeholder: t('externalTransactions.filters.allStatus'),
                options: Object.values(ExternalTransactionStatus).map(s => ({
                  value: s, label: t(`externalTransactions.status.${s}`),
                })),
              },
            ].map((sel, i) => (
              <select
                key={i}
                value={sel.value}
                onChange={e => sel.onChange(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
              >
                <option value="">{sel.placeholder}</option>
                {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ))}
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={e => setFilters({ ...filters, startDate: e.target.value || undefined })}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
            />
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={e => setFilters({ ...filters, endDate: e.target.value || undefined })}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
            />
            <input
              type="text"
              value={filters.search || ''}
              onChange={e => setFilters({ ...filters, search: e.target.value || undefined })}
              placeholder={t('externalTransactions.filters.search')}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canCreate && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-lg hover:bg-[#adc40f] transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('externalTransactions.actions.create')}
              </button>
            )}
            <button
              onClick={handleExportCSV}
              disabled={transactions.length === 0}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={transactions.length === 0}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  t('externalTransactions.table.date'),
                  t('externalTransactions.table.description'),
                  t('externalTransactions.table.amount'),
                  t('externalTransactions.table.type'),
                  t('externalTransactions.table.category'),
                  t('externalTransactions.table.status'),
                  t('externalTransactions.table.actions'),
                ].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                    {new Date(tx.transactionDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p className="font-medium text-slate-800">{tx.description}</p>
                    {tx.referenceNumber && (
                      <p className="text-xs text-slate-400 mt-0.5">Réf : {tx.referenceNumber}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <span className={`font-semibold ${isCredit(tx.externalTransactionType, tx.externalTransactionCategory) ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(tx.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {t(`externalTransactions.types.${tx.externalTransactionType}`)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {t(`externalTransactions.categories.${tx.externalTransactionCategory}`)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[tx.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {t(`externalTransactions.status.${tx.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {tx.status === ExternalTransactionStatus.DRAFT && canValidate && (
                        <>
                          <button
                            onClick={() => handleValidate(tx.id)}
                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title={t('externalTransactions.actions.validate')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleCancel(tx.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title={t('externalTransactions.actions.cancel')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </>
                      )}
                      {hasRole([UserRole.ADMIN]) && (
                        <button
                          onClick={() => tx.status === ExternalTransactionStatus.DRAFT ? handleDelete(tx.id) : handleAdminDelete(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('externalTransactions.actions.delete')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <EmptyState icon="finance" title={t('externalTransactions.noData')} />
        )}
      </div>

      {/* Modal création / édition */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* En-tête modal */}
            <div className="bg-gradient-to-r from-[#c6e911] to-[#adc40f] px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {showCreateModal ? t('externalTransactions.create.title') : t('externalTransactions.edit.title')}
              </h3>
              <button onClick={closeModal} className="text-slate-700 hover:text-slate-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Corps */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Colonne gauche */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {t('externalTransactions.form.date')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.transactionDate}
                      onChange={e => setFormData({ ...formData, transactionDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {t('externalTransactions.form.amount')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-medium">FCFA</span>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] focus:outline-none"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {t('externalTransactions.form.type')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.externalTransactionType}
                      onChange={e => setFormData({ ...formData, externalTransactionType: e.target.value as ExternalTransactionType })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] focus:outline-none"
                    >
                      {Object.values(ExternalTransactionType).map(type => (
                        <option key={type} value={type}>{t(`externalTransactions.types.${type}`)}</option>
                      ))}
                    </select>
                    {formData.externalTransactionType === ExternalTransactionType.OTHER_FINANCIAL && (
                      <input
                        type="text"
                        value={customTransactionType}
                        onChange={e => setCustomTransactionType(e.target.value)}
                        placeholder="Précisez le type…"
                        className="mt-2 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#c6e911] focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {t('externalTransactions.form.category')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.externalTransactionCategory}
                      onChange={e => setFormData({ ...formData, externalTransactionCategory: e.target.value as ExternalTransactionCategory })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] focus:outline-none"
                    >
                      {Object.values(ExternalTransactionCategory).map(cat => (
                        <option key={cat} value={cat}>{t(`externalTransactions.categories.${cat}`)}</option>
                      ))}
                    </select>
                    {formData.externalTransactionCategory === ExternalTransactionCategory.OTHER && (
                      <input
                        type="text"
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        placeholder="Précisez la catégorie…"
                        className="mt-2 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#c6e911] focus:outline-none"
                      />
                    )}
                  </div>
                </div>

                {/* Colonne droite */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {t('externalTransactions.form.paymentMethod')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] focus:outline-none"
                    >
                      {Object.values(PaymentMethod).map(m => (
                        <option key={m} value={m}>{t(`paymentMethods.${m}`)}</option>
                      ))}
                    </select>
                  </div>

                  {(formData.paymentMethod === PaymentMethod.BANK_TRANSFER || formData.paymentMethod === PaymentMethod.CHECK) && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        {t('externalTransactions.form.referenceNumber')}
                      </label>
                      <input
                        type="text"
                        value={formData.referenceNumber}
                        onChange={e => setFormData({ ...formData, referenceNumber: e.target.value })}
                        placeholder="Ex : REF-001"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#c6e911] focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {t('externalTransactions.form.document')}
                    </label>
                    <label
                      htmlFor="doc-upload"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-[#c6e911] transition-colors text-sm text-slate-500"
                    >
                      <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {fileUpload ? fileUpload.name : 'Importer un fichier'}
                    </label>
                    <input
                      id="doc-upload"
                      type="file"
                      onChange={e => setFileUpload(e.target.files?.[0] || null)}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </div>
                </div>
              </div>

              {/* Description pleine largeur */}
              <div className="mt-5">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t('externalTransactions.form.description')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez cette transaction…"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Pied modal */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={showCreateModal ? handleCreate : handleUpdate}
                className="px-5 py-2 rounded-lg bg-[#c6e911] text-slate-800 text-sm font-semibold hover:bg-[#adc40f] transition-colors"
              >
                {showCreateModal ? t('common.create') : t('common.update')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalTransactions;
