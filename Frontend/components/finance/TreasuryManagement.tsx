import React, { useState, useMemo } from 'react';
import { FinancialTransaction, Subsidiary, TreasuryAccount, TransactionType, TransactionStatus } from '../../types';
import { useI18n } from '../../i18n';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTreasuryAccounts, getFinancialTransactions, createIncomeTransaction, createExpenseTransaction } from '../../services/apiFinance/apiTreasury';
import TransactionFormModal, { TransactionFormData } from './TransactionFormModal';

interface TreasuryManagementProps {
    subsidiary: Subsidiary;
}

const TreasuryManagement: React.FC<TreasuryManagementProps> = ({ subsidiary }) => {
    const { t, formatCurrency } = useI18n();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<TransactionType>('DEPENSE');

    const queryKey = (key: string) => [key, subsidiary.id];

    const { data: treasuryAccounts = [], isLoading: l1 } = useQuery<TreasuryAccount[]>({ 
        queryKey: queryKey('treasuryAccounts'), 
        queryFn: getTreasuryAccounts,
        enabled: !!subsidiary.id // N'exécute la requête que si subsidiary.id existe
    });
    const { data: transactions = [], isLoading: l2 } = useQuery<FinancialTransaction[]>({ 
        queryKey: queryKey('financialTransactions'), 
        queryFn: getFinancialTransactions,
        enabled: !!subsidiary.id // N'exécute la requête que si subsidiary.id existe
    });

    const { mutate: saveTransaction } = useMutation({
        mutationFn: (data: { formData: TransactionFormData; type: TransactionType }) => {
            const transactionData = {
                ...data.formData,
                transactionDate: data.formData.transactionDate, // Map date to transactionDate
                status: TransactionStatus.PENDING,
            };
            return data.type === 'RECETTE' ? createIncomeTransaction(transactionData) : createExpenseTransaction(transactionData);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('financialTransactions') }),
    });

    const getStatusClass = (status: TransactionStatus) => {
        switch (status) {
            case TransactionStatus.VALIDATED: return 'bg-green-100 text-green-800';
            case TransactionStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    }
    
    const getTranslatedStatus = (status: TransactionStatus) => {
        switch (status) {
            case TransactionStatus.VALIDATED: return t('treasury.statusValidated');
            case TransactionStatus.PENDING: return t('treasury.statusPending');
            default: return status;
        }
    }
    
    const getTranslatedType = (type: TransactionType) => {
        switch (type) {
            case 'RECETTE': return t('treasury.typeIncome');
            case 'DEPENSE': return t('treasury.typeExpense');
            default: return type;
        }
    }

    const handlePrint = () => window.print();

    const handleExport = () => {
        const headers = [
            { key: 'transactionDate', label: t('treasury.date') },
            { key: 'description', label: t('treasury.description') },
            { key: 'treasuryAccountName', label: t('treasury.account') },
            { key: 'financialTransactionType', label: t('treasury.type') },
            { key: 'amount', label: t('treasury.amount') },
            { key: 'status', label: t('treasury.status') },
        ];
        const data = transactions.map(tx => ({
            ...tx,
            financialTransactionType: getTranslatedType(tx.financialTransactionType),
            status: getTranslatedStatus(tx.status),
        }));
        exportToCsv('transactions_tresorerie', headers, data);
    };

    const handleExportPdf = () => {
        const headers = [
            { key: 'transactionDate', label: t('treasury.date') },
            { key: 'description', label: t('treasury.description') },
            { key: 'treasuryAccountName', label: t('treasury.account') },
            { key: 'financialTransactionType', label: t('treasury.type') },
            { key: 'amount', label: t('treasury.amount') },
            { key: 'status', label: t('treasury.status') },
        ];
        const data = transactions.map(tx => ({
            ...tx,
            financialTransactionType: getTranslatedType(tx.financialTransactionType),
            status: getTranslatedStatus(tx.status),
            amount: `${tx.financialTransactionType === 'RECETTE' ? '+' : '-'}${formatCurrency(tx.amount)}`
        }));
        exportToPdf(t('treasury.recentTransactions'), headers, data, 'tresorerie');
    };

    const handleOpenModal = (type: TransactionType) => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleSaveTransaction = (formData: TransactionFormData, type: TransactionType) => {
        saveTransaction({ formData, type });
        setIsModalOpen(false);
    };

    const isLoading = l1 || l2;

    if (isLoading) {
        return <div className="p-6 text-center">{t('common.loading')}</div>;
    }

    return (
        <div className="space-y-6">
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
                {treasuryAccounts.map(account => (
                    <div key={account.id} className="bg-white p-6 rounded-xl shadow-md flex flex-col">
                        <h4 className="font-semibold text-slate-500">{account.name}</h4>
                        <div className="flex-grow flex items-end mt-2"><p className="text-3xl font-bold text-slate-800 whitespace-nowrap">{formatCurrency(account.balance)}</p></div>
                    </div>
                ))}
            </div>*/}

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{t('treasury.recentTransactions')}</h3>
                    <div className="flex flex-wrap items-center gap-2 no-print self-start md:self-center">
                         <button onClick={() => handleOpenModal('DEPENSE')} className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-md hover:bg-red-600 transition-colors">{t('treasury.addExpense')}</button>
                         <button onClick={() => handleOpenModal('RECETTE')} className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-md hover:bg-green-600 transition-colors">{t('treasury.addIncome')}</button>
                         <button onClick={handlePrint} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                            <IconPrint className="h-4 w-4" />
                            <span>{t('common.print')}</span>
                        </button>
                        <button onClick={handleExport} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                            <IconExport className="h-4 w-4" />
                            <span>{t('common.export')}</span>
                        </button>
                        <button onClick={handleExportPdf} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                            <IconPdf className="h-4 w-4" />
                            <span>{t('common.exportPdf')}</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('treasury.date')}</th>
                                <th scope="col" className="px-6 py-3">{t('treasury.description')}</th>
                                <th scope="col" className="px-6 py-3">{t('treasury.account')}</th>
                                <th scope="col" className="px-6 py-3">{t('treasury.type')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('treasury.amount')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('treasury.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4">{new Date(tx.transactionDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{tx.description}</td>
                                    <td className="px-6 py-4 text-slate-800">{treasuryAccounts.find(a => a.id === tx.treasuryAccountId)?.name}</td>
                                    <td className={`px-6 py-4 font-semibold ${tx.financialTransactionType === 'RECETTE' ? 'text-green-600' : 'text-red-600'}`}>{getTranslatedType(tx.financialTransactionType)}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${tx.financialTransactionType === 'RECETTE' ? 'text-green-700' : 'text-red-700'}`}>
                                        {tx.financialTransactionType === 'RECETTE' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                         <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(tx.status)}`}>
                                            {getTranslatedStatus(tx.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <TransactionFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTransaction}
                transactionType={modalType}
                accounts={treasuryAccounts}
            />
        </div>
    );
};

export default TreasuryManagement;