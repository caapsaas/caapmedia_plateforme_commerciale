import React, { useState } from 'react';
import { FinancialTransaction, Subsidiary, TreasuryAccount, TransactionType, UserRole } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useHasRole } from '../../hooks/useHasRole';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';
import IconDelete from '../icons/IconDelete';
import IconEye from '../icons/IconEye';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTreasuryAccounts, getFinancialTransactions, createIncomeTransaction, createExpenseTransaction, deleteTransaction } from '../../services/apiFinance/apiTreasury';
import TransactionFormModal, { TransactionFormData } from './TransactionFormModal';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';

interface TreasuryManagementProps {
    subsidiary: Subsidiary;
}

const TreasuryManagement: React.FC<TreasuryManagementProps> = ({ subsidiary }) => {
    const { t, formatCurrency } = useI18n();
    const queryClient = useQueryClient();
    const toast = useToast();
    const { user } = useAuth();
    const { hasRole } = useHasRole();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<TransactionType>('DEPENSE');
    const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Permissions alignées avec le backend (treasury.service.ts)
    const canDeleteTransactions = hasRole([UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR]);
    const canCreateTransactions = hasRole([UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.CAISSIER]);

    // État pour la boîte de dialogue de confirmation
    const [confirmDialog, setConfirmDialog] = useState<{
        show: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        onCancel: () => void;
    }>({
        show: false,
        title: '',
        message: '',
        onConfirm: () => {},
        onCancel: () => {}
    });

    // Fonction pour afficher la boîte de dialogue de confirmation
    const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
        setConfirmDialog({
            show: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmDialog(prev => ({ ...prev, show: false }));
            },
            onCancel: () => {
                setConfirmDialog(prev => ({ ...prev, show: false }));
            }
        });
    };

    const queryKey = (key: string) => [key, subsidiary.id];

    const { data: treasuryAccounts = [], isLoading: l1 } = useQuery<TreasuryAccount[]>({ 
        queryKey: queryKey('treasuryAccounts'), 
        queryFn: () => getTreasuryAccounts(subsidiary.id),
        enabled: !!subsidiary.id
    });
    
    const { data: transactions = [], isLoading: l2 } = useQuery<FinancialTransaction[]>({
        queryKey: queryKey('financialTransactions'),
        queryFn: () => getFinancialTransactions(subsidiary.id),
        enabled: !!subsidiary.id
    });

    // Lookup map pour éviter un O(n) par ligne dans le tableau
    const accountMap = React.useMemo(
        () => new Map(treasuryAccounts.map(a => [a.id, a.accountName])),
        [treasuryAccounts]
    );

    const { mutate: saveTransaction } = useMutation({
        mutationFn: (data: { formData: TransactionFormData; type: TransactionType }) => {
            return data.type === 'RECETTE' ? createIncomeTransaction(data.formData) : createExpenseTransaction(data.formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKey('financialTransactions') });
            queryClient.invalidateQueries({ queryKey: queryKey('treasuryAccounts') });
            toast.success(
                t('treasury.transactionCreated'),
                t('treasury.transactionCreatedSuccess')
            );
        },
        onError: (error: any) => {
            toast.error(
                t('treasury.transactionError'),
                error.message || t('treasury.transactionErrorMessage')
            );
        },
    });

    const { mutate: deleteTransactionMutation } = useMutation({
        mutationFn: deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKey('financialTransactions') });
            queryClient.invalidateQueries({ queryKey: queryKey('treasuryAccounts') });
            toast.success(
                t('treasury.transactionDeleted'),
                t('treasury.transactionDeletedSuccess')
            );
        },
        onError: (error: any) => {
            toast.error(
                t('treasury.transactionDeleteError'),
                error.message || t('treasury.transactionDeleteError')
            );
        },
    });

    
    
        
    const getTranslatedType = (type: TransactionType) => {
        switch (type) {
            case 'RECETTE': return t('treasury.typeIncome');
            case 'DEPENSE': return t('treasury.typeExpense');
            default: return type;
        }
    }

    const handlePrint = () => window.print();

    const handleExport = () => {
        try {
            const headers = [
                { key: 'transactionDate', label: t('treasury.date') },
                { key: 'description', label: t('treasury.description') },
                { key: 'providerName', label: 'Nom du prestataire' },
                { key: 'providerPhone', label: 'Téléphone du prestataire' },
                { key: 'treasuryAccountName', label: t('treasury.account') },
                { key: 'financialTransactionType', label: t('treasury.type') },
                { key: 'amount', label: t('treasury.amount') },
                            ];
            const data = transactions.map(tx => ({
                ...tx,
                financialTransactionType: getTranslatedType(tx.financialTransactionType),
            }));
            exportToCsv('transactions_tresorerie', headers, data);
            toast.success(
                t('common.exportSuccess'),
                t('treasury.csvExportSuccess')
            );
        } catch (error) {
            toast.error(
                t('common.exportError'),
                t('treasury.csvExportError')
            );
        }
    };

    const handleExportPdf = () => {
        try {
            const headers = [
                { key: 'transactionDate', label: t('treasury.date') },
                { key: 'description', label: t('treasury.description') },
                { key: 'providerName', label: 'Nom du prestataire' },
                { key: 'providerPhone', label: 'Téléphone du prestataire' },
                { key: 'treasuryAccountName', label: t('treasury.account') },
                { key: 'financialTransactionType', label: t('treasury.type') },
                { key: 'amount', label: t('treasury.amount') },
                            ];
            const data = transactions.map(tx => ({
                ...tx,
                financialTransactionType: getTranslatedType(tx.financialTransactionType),
                amount: `${tx.financialTransactionType === 'RECETTE' ? '+' : '-'}${formatCurrency(Number(tx.amount))}`
            }));
            exportToPdf(t('treasury.recentTransactions'), headers, data, 'tresorerie');
            toast.success(
                t('common.exportSuccess'),
                t('treasury.pdfExportSuccess')
            );
        } catch (error) {
            toast.error(
                t('common.exportError'),
                t('treasury.pdfExportError')
            );
        }
    };

    const handleOpenModal = (type: TransactionType) => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleSaveTransaction = (formData: TransactionFormData, type: TransactionType) => {
        saveTransaction({ formData, type });
        setIsModalOpen(false);
        toast.info(
            t('treasury.transactionProcessing'),
            t('treasury.transactionProcessingMessage')
        );
    };

    const handleDeleteTransaction = (transactionId: string) => {
        showConfirmDialog(
            t('treasury.confirmDelete'),
            t('treasury.confirmDeleteMessage'),
            () => deleteTransactionMutation(transactionId)
        );
    };

    const handleShowDetails = (transaction: FinancialTransaction) => {
        setSelectedTransaction(transaction);
        setIsDetailsModalOpen(true);
    };

    const handleCloseDetails = () => {
        setSelectedTransaction(null);
        setIsDetailsModalOpen(false);
    };

    
    return (
        <>
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
                    {l1 ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white p-6 rounded-xl shadow-md flex flex-col animate-pulse">
                                <div className="h-4 bg-slate-200 rounded w-24 mb-4" />
                                <div className="h-8 bg-slate-200 rounded w-32" />
                            </div>
                        ))
                    ) : treasuryAccounts.map(account => (
                        <div key={account.id} className="bg-white p-6 rounded-xl shadow-md flex flex-col">
                            <h4 className="font-semibold text-slate-500">{account.accountName}</h4>
                            <div className="flex-grow flex items-end mt-2">
                                <p className="text-3xl font-bold text-slate-800 whitespace-nowrap">{formatCurrency(account.balance)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <h3 className="text-xl font-semibold text-slate-800">{t('treasury.recentTransactions')}</h3>
                        <div className="flex flex-wrap items-center gap-2 no-print self-start md:self-center">
                            {canCreateTransactions && (
                                <>
                                    <button onClick={() => handleOpenModal('DEPENSE')} className="px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                                        {t('treasury.addExpense')}
                                    </button>
                                    <button onClick={() => handleOpenModal('RECETTE')} className="px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                                        {t('treasury.addIncome')}
                                    </button>
                                </>
                            )}
                            <button onClick={handlePrint} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-800 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                                <IconPrint className="h-4 w-4" />
                                <span>{t('common.print')}</span>
                            </button>
                            <button onClick={handleExport} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-800 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                                <IconExport className="h-4 w-4" />
                                <span>{t('common.export')}</span>
                            </button>
                            <button onClick={handleExportPdf} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-800 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
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
                                    <th scope="col" className="px-6 py-3">Nom du prestataire</th>
                                    <th scope="col" className="px-6 py-3">Téléphone</th>
                                    <th scope="col" className="px-6 py-3">{t('treasury.account')}</th>
                                    <th scope="col" className="px-6 py-3">{t('treasury.type')}</th>
                                    <th scope="col" className="px-6 py-3 text-right">{t('treasury.amount')}</th>
                                    <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {l2 ? (
                                    <TableSkeleton rows={8} columns={8} />
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={8}>
                                            <EmptyState icon="finance" title={t('treasury.recentTransactions')} description={t('common.notAvailable')} />
                                        </td>
                                    </tr>
                                ) : transactions.map((tx) => (
                                    <tr key={tx.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4">{new Date(tx.transactionDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{tx.description}</td>
                                        <td className="px-6 py-4 text-slate-800">{tx.providerName || '-'}</td>
                                        <td className="px-6 py-4 text-slate-800">{tx.providerPhone || '-'}</td>
                                        <td className="px-6 py-4 text-slate-800">{accountMap.get(tx.treasuryAccountId)}</td>
                                        <td className={`px-6 py-4 font-semibold ${tx.financialTransactionType === 'RECETTE' ? 'text-green-600' : 'text-red-600'}`}>
                                            {getTranslatedType(tx.financialTransactionType)}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${tx.financialTransactionType === 'RECETTE' ? 'text-green-700' : 'text-red-700'}`}>
                                            {tx.financialTransactionType === 'RECETTE' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                                        </td>
                                        <td className="px-6 py-4 text-center no-print">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Bouton Détails - disponible pour tous */}
                                                <button
                                                    onClick={() => handleShowDetails(tx)}
                                                    className="p-2 text-[#c6e911] hover:text-[#adc40f] rounded-full transition-colors"
                                                    title={t('common.details')}
                                                >
                                                    <IconEye className="h-4 w-4" />
                                                </button>

                                                {/* Bouton Supprimer - uniquement pour l'admin */}
                                                {canDeleteTransactions && (
                                                    <button
                                                        onClick={() => handleDeleteTransaction(tx.id)}
                                                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                                        title={t('common.delete')}
                                                    >
                                                        <IconDelete className="h-4 w-4" />
                                                    </button>
                                                )}

                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <TransactionFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTransaction}
                transactionType={modalType}
                subsidiaryId={subsidiary.id}
            />
            
            {/* Modal pour afficher les détails d'une transaction */}
            {isDetailsModalOpen && selectedTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-semibold text-slate-800">{t('treasury.transactionDetails')}</h3>
                            <button
                                onClick={handleCloseDetails}
                                className="p-2 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-500">{t('treasury.date')}</label>
                                    <p className="text-slate-800">{new Date(selectedTransaction.transactionDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-500">{t('treasury.type')}</label>
                                    <p className={`font-semibold ${selectedTransaction.financialTransactionType === 'RECETTE' ? 'text-green-600' : 'text-red-600'}`}>
                                        {getTranslatedType(selectedTransaction.financialTransactionType)}
                                    </p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-slate-500">{t('treasury.description')}</label>
                                <p className="text-slate-800">{selectedTransaction.description}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-500">Nom du prestataire</label>
                                    <p className="text-slate-800">{selectedTransaction.providerName || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-500">Téléphone du prestataire</label>
                                    <p className="text-slate-800">{selectedTransaction.providerPhone || '-'}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-500">{t('treasury.account')}</label>
                                    <p className="text-slate-800">{accountMap.get(selectedTransaction.treasuryAccountId)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-500">{t('treasury.amount')}</label>
                                    <p className={`text-xl font-bold ${selectedTransaction.financialTransactionType === 'RECETTE' ? 'text-green-700' : 'text-red-700'}`}>
                                        {selectedTransaction.financialTransactionType === 'RECETTE' ? '+' : '-'}{formatCurrency(Number(selectedTransaction.amount))}
                                    </p>
                                </div>
                            </div>
                            
                                                        
                            {selectedTransaction.relatedDocumentId && (
                                <div>
                                    <label className="text-sm font-medium text-slate-500">{t('treasury.relatedDocument')}</label>
                                    <p className="text-slate-800">{selectedTransaction.relatedDocumentId}</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={handleCloseDetails}
                                className="px-4 py-2 bg-slate-200 text-slate-800 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors"
                            >
                                {t('common.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Boîte de dialogue de confirmation personnalisée */}
            {confirmDialog.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">{confirmDialog.title}</h3>
                        <p className="text-slate-600 mb-6">{confirmDialog.message}</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={confirmDialog.onCancel}
                                className="px-4 py-2 bg-slate-200 text-slate-800 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={confirmDialog.onConfirm}
                                className="px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors"
                            >
                                {t('common.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TreasuryManagement;
