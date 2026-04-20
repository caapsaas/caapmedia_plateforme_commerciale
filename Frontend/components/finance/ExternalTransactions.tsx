import React, { useState, useEffect } from 'react';
import { ExternalFinancialTransaction, ExternalTransactionType, ExternalTransactionCategory, ExternalTransactionStatus, PaymentMethod, Subsidiary, UserRole } from '../../types/models';
import { getExternalTransactions, createExternalTransaction, updateExternalTransaction, validateExternalTransaction, cancelExternalTransaction, deleteExternalTransaction, getExternalTransactionStatistics, ExternalTransactionFilters, ExternalTransactionStatistics, CreateExternalTransactionData } from '../../services/apiFinance/apiExternalTransactions';
import { getPrefinancementAccount, getPrefinancementStatistics } from '../../services/apiFinance/apiPrefinancement';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { exportToCSV, formatAmount, calculateTotals } from '../../utils/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
  }
}

interface ExternalTransactionsProps {
  subsidiary: Subsidiary;
}

const ExternalTransactions: React.FC<ExternalTransactionsProps> = ({ subsidiary }) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Vérifier les permissions
  const canCreate = user?.userRole === UserRole.FINANCIAL_DIRECTOR;
  const canValidate = user?.userRole === UserRole.ADMIN;
  
  if (!canCreate && !canValidate) {
    return (
      <div className="p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            {t('common.accessDenied')}
          </h3>
          <p className="text-yellow-700">
            {t('externalTransactions.accessDenied')}
          </p>
        </div>
      </div>
    );
  }
  
  const [transactions, setTransactions] = useState<ExternalFinancialTransaction[]>([]);
  const [statistics, setStatistics] = useState<ExternalTransactionStatistics | null>(null);
  const [financingAccount, setFinancingAccount] = useState<any>(null);
  const [financingStats, setFinancingStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ExternalFinancialTransaction | null>(null);
  const [filters, setFilters] = useState<ExternalTransactionFilters>({});
  
  // Form state
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

  // Load data
  useEffect(() => {
    loadData();
  }, [subsidiary.id, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, statisticsData] = await Promise.all([
        getExternalTransactions(subsidiary.id, filters),
        getExternalTransactionStatistics(subsidiary.id)
      ]);
      
      // Gérer le compte de financement séparément pour créer si nécessaire
      let accountData = null;
      let statsData = null;
      
      try {
        accountData = await getPrefinancementAccount(subsidiary.id);
        statsData = await getPrefinancementStatistics(subsidiary.id);
      } catch (error) {
        // Si le compte n'existe pas, créer un compte par défaut
        console.log('Le compte de financement n\'existe pas, utilisation d\'un compte par défaut');
        accountData = {
          id: 'default',
          accountName: `Compte Financement ${subsidiary.name}`,
          balance: 0,
          currency: 'XOF',
          lastUpdated: new Date().toISOString(),
          subsidiaryId: subsidiary.id
        };
        statsData = {
          totalBalance: 0,
          totalCredits: 0,
          totalDebits: 0,
          transactionCount: 0,
          creditsByCategory: [],
          debitsByCategory: []
        };
      }
      
      setTransactions(transactionsData);
      setStatistics(statisticsData);
      setFinancingAccount(accountData);
      setFinancingStats(statsData);
    } catch (error) {
      toast('error', t('externalTransactions.error.loading'));
    } finally {
      setLoading(false);
    }
  };

  // Notifications supprimées

  const handleCreate = async () => {
    try {
      // Validation des données
      const amountValue = parseFloat(formData.amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        toast('error', t('externalTransactions.error.invalidAmount'));
        return;
      }
      
      if (!formData.transactionDate) {
        toast('error', t('externalTransactions.error.invalidDate'));
        return;
      }
      
      // Vérifier que la date est valide
      const dateObj = new Date(formData.transactionDate);
      if (isNaN(dateObj.getTime())) {
        toast('error', t('externalTransactions.error.invalidDate'));
        return;
      }
      
      if (!formData.description.trim()) {
        toast('error', t('externalTransactions.error.invalidDescription'));
        return;
      }
      
      // Préparer la description avec le type personnalisé si applicable
      let finalDescription = formData.description.trim();
      if (formData.externalTransactionType === ExternalTransactionType.OTHER_FINANCIAL && customTransactionType.trim()) {
        finalDescription = `[${customTransactionType.trim()}] ${finalDescription}`;
      }

      const createData: CreateExternalTransactionData = {
        transactionDate: new Date(formData.transactionDate).toISOString().split('T')[0], // Ensure YYYY-MM-DD format
        description: finalDescription,
        amount: amountValue,
        externalTransactionType: formData.externalTransactionType,
        externalTransactionCategory: formData.externalTransactionCategory,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber?.trim() || undefined,
        createdBy: user!.id,
        subsidiaryId: subsidiary.id,
      };
      
      // Diagnostic pour production
      if (window.location.hostname === 'caapmedia.com') {
        console.log('🔍 PRODUCTION DIAGNOSTIC:');
        console.log('Sending enum values:', {
          type: formData.externalTransactionType,
          category: formData.externalTransactionCategory,
          payment: formData.paymentMethod
        });
        console.log('Available types:', Object.values(ExternalTransactionType));
        console.log('Available categories:', Object.values(ExternalTransactionCategory));
        console.log('Available payments:', Object.values(PaymentMethod));
      }
      
      console.log('Creating transaction with data:', JSON.stringify(createData, null, 2));
      console.log('User ID:', user!.id);
      console.log('Subsidiary ID:', subsidiary.id);
      console.log('User object:', user);
      console.log('Subsidiary object:', subsidiary);
      
      const newTransaction = await createExternalTransaction(createData);
      
      // Notifications désactivées
      
      setShowCreateModal(false);
      resetForm();
      loadData();
      toast('success', t('externalTransactions.success.created'));
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      
      // Afficher les détails de l'erreur 400
      if (error.response?.status === 400) {
        console.error('Validation error details:', error.response.data);
        const errorData = error.response.data;
        
        // Extraire le message d'erreur principal
        let errorMessage = errorData?.message || errorData?.error || 'Données invalides';
        
        console.error('Complete error message:', errorMessage);
        
        // Si c'est une erreur Prisma, extraire les détails complets
        if (typeof errorMessage === 'string' && errorMessage.includes('Invalid value')) {
          console.error('Prisma validation error detected');
          
          // Extraire toutes les lignes pertinentes de l'erreur
          const lines = errorMessage.split('\n').filter(line => line.trim());
          const relevantLines = lines.filter(line => 
            line.includes('Invalid value') || 
            line.includes('Got') || 
            line.includes('Expected') ||
            line.includes('Argument')
          );
          
          const displayError = relevantLines.length > 0 ? relevantLines.join(' | ') : errorMessage.split('\n')[0];
          toast('error', `Erreur de validation: ${displayError}`);
        } 
        // Afficher les erreurs de validation spécifiques si disponibles
        else if (Array.isArray(errorData?.message)) {
          const validationErrors = errorData.message.join(', ');
          toast('error', `Erreur de validation: ${validationErrors}`);
        } else {
          // Afficher le message complet mais tronqué si trop long
          const displayMessage = errorMessage.length > 200 ? errorMessage.substring(0, 200) + '...' : errorMessage;
          toast('error', `Erreur: ${displayMessage}`);
        }
      } else {
        toast('error', t('externalTransactions.error.create'));
      }
    }
  };

  const handleUpdate = async () => {
    if (!selectedTransaction) return;
    
    try {
      // Préparer la description avec le type personnalisé si applicable
      let finalDescription = formData.description.trim();
      if (formData.externalTransactionType === ExternalTransactionType.OTHER_FINANCIAL && customTransactionType.trim()) {
        finalDescription = `[${customTransactionType.trim()}] ${finalDescription}`;
      }

      const updateData = {
        transactionDate: formData.transactionDate,
        description: finalDescription,
        amount: parseFloat(formData.amount),
        externalTransactionType: formData.externalTransactionType,
        externalTransactionCategory: formData.externalTransactionCategory,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || undefined,
      };
      
      console.log('Updating transaction with data:', updateData);
      console.log('Transaction ID:', selectedTransaction.id);
      
      // Utiliser la route admin si la transaction est validée et l'utilisateur est admin/directeur financier
      if (selectedTransaction.status === ExternalTransactionStatus.VALIDATED && (user?.userRole === UserRole.ADMIN || user?.userRole === UserRole.FINANCIAL_DIRECTOR)) {
        await updateExternalTransaction(selectedTransaction.id, updateData); // TODO: Remplacer par la route admin quand disponible
        toast('success', t('externalTransactions.success.adminUpdated'));
      } else {
        await updateExternalTransaction(selectedTransaction.id, updateData);
        toast('success', t('externalTransactions.success.updated'));
      }
      
      // Notifications désactivées
      setShowEditModal(false);
      setSelectedTransaction(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast('error', t('externalTransactions.error.update'));
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await validateExternalTransaction(id);
      
      // Notifications désactivées
      loadData();
      toast('success', t('externalTransactions.success.validated'));
    } catch (error) {
      toast('error', t('externalTransactions.error.validate'));
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelExternalTransaction(id);
      
      // Notifications désactivées
      loadData();
      toast('success', t('externalTransactions.success.cancelled'));
    } catch (error) {
      toast('error', t('externalTransactions.error.cancel'));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('externalTransactions.confirm.delete'))) {
      try {
        await deleteExternalTransaction(id);
      
      // Notifications désactivées
        loadData();
        toast('success', t('externalTransactions.success.deleted'));
      } catch (error) {
        toast('error', t('externalTransactions.error.delete'));
      }
    }
  };

  const handleAdminDelete = async (id: string) => {
    if (window.confirm(t('externalTransactions.confirm.adminDelete'))) {
      try {
        // Utiliser la route admin pour supprimer une transaction validée
        await deleteExternalTransaction(id); // TODO: Remplacer par la route admin quand disponible
      
      // Notifications désactivées
        loadData();
        toast('success', t('externalTransactions.success.adminDeleted'));
      } catch (error) {
        toast('error', t('externalTransactions.error.adminDelete'));
      }
    }
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

  const getStatusColor = (status: ExternalTransactionStatus) => {
    switch (status) {
      case ExternalTransactionStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800';
      case ExternalTransactionStatus.VALIDATED:
        return 'bg-green-100 text-green-800';
      case ExternalTransactionStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: ExternalTransactionType, category?: ExternalTransactionCategory) => {
    // Vert uniquement pour TRANSFERT_PDG avec catégorie TRANSFERT_PDG
    if (type === ExternalTransactionType.TRANSFER_PDG && category === ExternalTransactionCategory.TRANSFER_PDG) {
      return 'text-green-600';
    }
    // Rouge pour tout le reste
    return 'text-red-600';
  };

  const handleExportCSV = () => {
    const filename = `${t('externalTransactions.title')}_${subsidiary.name}_${new Date().toISOString().split('T')[0]}`;
    exportToCSV(transactions, filename);
    toast('success', t('externalTransactions.success.exported'));
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(`${t('externalTransactions.title')} - ${subsidiary.name}`, 14, 22);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 32);
    
    // Prepare table data
    const tableData = transactions.map(transaction => [
      new Date(transaction.transactionDate).toLocaleDateString(),
      transaction.description,
      formatAmount(transaction.amount),
      t(`externalTransactions.types.${transaction.externalTransactionType}`),
      t(`externalTransactions.categories.${transaction.externalTransactionCategory}`),
      t(`externalTransactions.status.${transaction.status}`),
      transaction.referenceNumber || ''
    ]);
    
    // Add table
    autoTable(doc, {
      head: [
        [t('externalTransactions.table.date'), 
         t('externalTransactions.table.description'), 
         t('externalTransactions.table.amount'), 
         t('externalTransactions.table.type'), 
         t('externalTransactions.table.category'), 
         t('externalTransactions.table.status'),
         t('externalTransactions.table.reference')]
      ],
      body: tableData,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    // Add summary
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(12);
    doc.text(`Total: ${transactions.length} transactions`, 14, finalY + 10);
    doc.text(`Total Income: ${formatAmount(totals.totalIncome)}`, 14, finalY + 20);
    doc.text(`Total Expenses: ${formatAmount(totals.totalExpenses)}`, 14, finalY + 30);
    doc.text(`Net Amount: ${formatAmount(totals.netAmount)}`, 14, finalY + 40);
    
    // Save the PDF
    const filename = `${t('externalTransactions.title')}_${subsidiary.name}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    toast('success', t('externalTransactions.success.exported'));
  };

  const totals = calculateTotals(transactions);

 
  if (loading) {
    return <div className="p-6 text-center">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
         
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">{t('externalTransactions.stats.total')}</h3>
            <p className="text-2xl font-bold text-gray-900">{statistics.totalTransactions}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">{t('externalTransactions.stats.totalAmount')}</h3>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(statistics.totalAmount)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">{t('externalTransactions.stats.validated')}</h3>
            <p className="text-2xl font-bold text-green-600">
              {statistics.transactionsByStatus.find(s => s.status === ExternalTransactionStatus.VALIDATED)?.count || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">{t('externalTransactions.stats.pending')}</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {statistics.transactionsByStatus.find(s => s.status === ExternalTransactionStatus.DRAFT)?.count || 0}
            </p>
          </div>
          {/* Summary Totals */}
          {/*<div className="bg-white p-6 rounded-lg shadow md:col-span-2 lg:col-span-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">{t('externalTransactions.stats.summary')}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">{t('externalTransactions.stats.totalIncome')}</p>
                <p className="text-lg font-bold text-green-600">{formatAmount(totals.totalIncome)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('externalTransactions.stats.totalExpenses')}</p>
                <p className="text-lg font-bold text-red-600">{formatAmount(totals.totalExpenses)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('externalTransactions.stats.netAmount')}</p>
                <p className={`text-lg font-bold ${totals.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(totals.netAmount)}
                </p>
              </div>
            </div>
          </div>*/}
        </div>
      )}

     

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('externalTransactions.filters.allTypes')}</option>
              {Object.values(ExternalTransactionType).map(type => (
                <option key={type} value={type}>{t(`externalTransactions.types.${type}`)}</option>
              ))}
            </select>
            
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as ExternalTransactionStatus || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('externalTransactions.filters.allStatus')}</option>
              {Object.values(ExternalTransactionStatus).map(status => (
                <option key={status} value={status}>{t(`externalTransactions.status.${status}`)}</option>
              ))}
            </select>
            
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('externalTransactions.filters.startDate')}
            />
            
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('externalTransactions.filters.endDate')}
            />
            
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('externalTransactions.filters.search')}
            />
          </div>
          
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('externalTransactions.actions.create')}</span>
            </button>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition-colors"
              disabled={transactions.length === 0}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{t('externalTransactions.actions.exportCSV')}</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors"
              disabled={transactions.length === 0}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{t('externalTransactions.actions.exportPDF')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('externalTransactions.table.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('externalTransactions.table.description')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('externalTransactions.table.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('externalTransactions.table.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('externalTransactions.table.category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('externalTransactions.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('externalTransactions.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.transactionDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      {transaction.referenceNumber && (
                        <div className="text-gray-500">{t('externalTransactions.table.reference')}: {transaction.referenceNumber}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${getTypeColor(transaction.externalTransactionType, transaction.externalTransactionCategory)}`}>
                      {formatAmount(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {t(`externalTransactions.types.${transaction.externalTransactionType}`)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {t(`externalTransactions.categories.${transaction.externalTransactionCategory}`)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {t(`externalTransactions.status.${transaction.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {transaction.status === ExternalTransactionStatus.DRAFT && canValidate && (
                        <>
                          <button
                            onClick={() => handleValidate(transaction.id)}
                            className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-100 rounded-full transition-colors"
                            title={t('externalTransactions.actions.validate')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleCancel(transaction.id)}
                            className="p-2 text-slate-500 hover:text-yellow-600 hover:bg-yellow-100 rounded-full transition-colors"
                            title={t('externalTransactions.actions.cancel')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </>
                      )}
                      {user?.userRole === UserRole.ADMIN && (
                        <>
                          {transaction.status === ExternalTransactionStatus.DRAFT ? (
                            <button
                              onClick={() => handleDelete(transaction.id)}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                              title={t('externalTransactions.actions.delete')}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAdminDelete(transaction.id)}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                              title={t('externalTransactions.actions.adminDelete')}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {t('externalTransactions.noData')}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#c6e911] to-[#a8d814] px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-white">
                {showCreateModal ? t('externalTransactions.create.title') : t('externalTransactions.edit.title')}
              </h3>
            </div>
            
            {/* Body with scroll */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('externalTransactions.form.date')}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.transactionDate}
                        onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-colors"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('externalTransactions.form.amount')}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 text-sm">FCFA</span>
                        <input
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-colors"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('externalTransactions.form.type')}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={formData.externalTransactionType}
                        onChange={(e) => setFormData({ ...formData, externalTransactionType: e.target.value as ExternalTransactionType })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-colors"
                      >
                        {Object.values(ExternalTransactionType).map(type => (
                          <option key={type} value={type}>{t(`externalTransactions.types.${type}`)}</option>
                        ))}
                      </select>
                      {formData.externalTransactionType === ExternalTransactionType.OTHER_FINANCIAL && (
                        <input
                          type="text"
                          value={customTransactionType}
                          onChange={(e) => setCustomTransactionType(e.target.value)}
                          className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-colors"
                          placeholder="Précisez le type de transaction..."
                        />
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('externalTransactions.form.category')}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={formData.externalTransactionCategory}
                        onChange={(e) => setFormData({ ...formData, externalTransactionCategory: e.target.value as ExternalTransactionCategory })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-colors"
                      >
                        {Object.values(ExternalTransactionCategory).map(category => (
                          <option key={category} value={category}>{t(`externalTransactions.categories.${category}`)}</option>
                        ))}
                      </select>
                      {formData.externalTransactionCategory === ExternalTransactionCategory.OTHER && (
                        <input
                          type="text"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-colors"
                          placeholder="Précisez la catégorie..."
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('externalTransactions.form.paymentMethod')}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-colors"
                      >
                        {Object.values(PaymentMethod).map(method => (
                          <option key={method} value={method}>{t(`paymentMethods.${method}`)}</option>
                        ))}
                      </select>
                    </div>
                    
                    {(formData.paymentMethod === PaymentMethod.BANK_TRANSFER || formData.paymentMethod === PaymentMethod.CHECK) && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('externalTransactions.form.referenceNumber')}
                        </label>
                        <input
                          type="text"
                          value={formData.referenceNumber}
                          onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-colors"
                          placeholder="Ex: REF-001"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('externalTransactions.form.document')}
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          id="document-upload"
                          onChange={(e) => setFileUpload(e.target.files?.[0] || null)}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                        <label
                          htmlFor="document-upload"
                          className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#c6e911] transition-colors"
                        >
                          <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-gray-600">
                            {fileUpload ? fileUpload.name : 'Importer un fichier'}
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    </div>
                </div>
                
                {/* Description Full Width */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('externalTransactions.form.description')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-colors resize-none"
                    rows={3}
                    placeholder="Décrivez cette transaction..."
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedTransaction(null);
                  resetForm();
                }}
                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={showCreateModal ? handleCreate : handleUpdate}
                className="px-6 py-2 bg-[#c6e911] text-slate-800 rounded-lg hover:bg-[#adc40f] focus:outline-none focus:ring-2 focus:ring-[#c6e911] transition-colors font-medium shadow-sm"
              >
                {showCreateModal ? t('common.create') : t('common.update')}
              </button>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedTransaction(null);
                resetForm();
              }}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalTransactions;
