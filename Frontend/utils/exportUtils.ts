import { ExternalFinancialTransaction, ExternalTransactionType } from '../types/models';

export const exportToCSV = (data: ExternalFinancialTransaction[], filename: string) => {
  // Define CSV headers
  const headers = [
    'Date',
    'Description',
    'Montant',
    'Type',
    'Catégorie',
    'Statut',
    'Méthode de paiement',
    'Numéro de référence',
    'Créé par',
    'Date de création'
  ];

  // Convert data to CSV format
  const csvData = data.map(transaction => [
    new Date(transaction.transactionDate).toLocaleDateString('fr-FR'),
    `"${transaction.description.replace(/"/g, '""')}"`, // Escape quotes in description
    transaction.amount.toString(),
    transaction.externalTransactionType,
    transaction.externalTransactionCategory,
    transaction.status,
    transaction.paymentMethod,
    transaction.referenceNumber || '',
    transaction.creator?.userName || '',
    new Date(transaction.createdAt).toLocaleDateString('fr-FR')
  ]);

  // Combine headers and data
  const csvContent = [headers, ...csvData]
    .map(row => row.join(','))
    .join('\n');

  // Create blob and download
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for proper UTF-8 handling
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data: ExternalFinancialTransaction[], filename: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatAmount = (amount: number, currency = 'FCFA'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF', // West African CFA franc
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('XOF', currency);
};

export const calculateTotals = (transactions: ExternalFinancialTransaction[]) => {
  const totals = transactions.reduce(
    (acc, transaction) => {
      // Types de revenus (recettes)
      const incomeTypes = [
        ExternalTransactionType.DONATION,
        ExternalTransactionType.PERSONAL_INCOME,
        ExternalTransactionType.INVESTMENT_RETURN,
        ExternalTransactionType.TAX_REFUND,
        ExternalTransactionType.INSURANCE_PAYOUT,
        ExternalTransactionType.LEGAL_SETTLEMENT
      ];
      
      if (incomeTypes.includes(transaction.externalTransactionType)) {
        acc.totalIncome += transaction.amount;
      } else {
        // Types de dépenses: INVESTMENT, LOAN, PERSONAL_EXPENSE, OTHER_FINANCIAL
        acc.totalExpenses += transaction.amount;
      }
      
      acc.totalAmount += transaction.amount;
      return acc;
    },
    { totalIncome: 0, totalExpenses: 0, totalAmount: 0 }
  );

  return {
    ...totals,
    netAmount: totals.totalIncome - totals.totalExpenses
  };
};
