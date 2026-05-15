import React, { useState, useMemo } from 'react';
import { Subsidiary, UserRole } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconCoins from '../icons/IconCoins';
import KpiCard from '../../Pages/KpiCard';
import { 
    PrimaryButton, 
    SecondaryButton, 
    SuccessButton, 
    FormPrimaryButton, 
    FormSecondaryButton,
    IconButton,
    DangerIconButton,
    WarningIconButton,
    PlusIcon,
    DownloadIcon,
    CheckIcon,
    XIcon,
    TrashIcon
} from '../common/FinanceButtons';
import {
    getPrefinancementAccount,
    getPrefinancementTransactions,
    getPrefinancementStatistics,
    createPrefinancementTransaction,
    validatePrefinancementTransaction,
    cancelPrefinancementTransaction,
    deletePrefinancementTransaction,
    PrefinancementTransaction,
    PrefinancementAccount,
    PrefinancementStatistics,
    PrefinancementTransactionCreationData,
    PrefinancementTransactionCreationWithSubsidiaryData,
    PrefinancementFilters
} from '../../services/apiFinance/apiPrefinancement';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PrefinancementManagement: React.FC<{ subsidiary: Subsidiary }> = ({ subsidiary }) => {
    const { t, formatCurrency } = useI18n();
    const toast = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [showAddForm, setShowAddForm] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Form state pour l'ajout/modification
    const [formData, setFormData] = useState<PrefinancementTransactionCreationData>({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        type: 'DEBIT',
        category: 'MATERIELS_PREMIER',
        referenceNumber: '',
        relatedOrderId: '',
        notes: ''
    });

    // Permissions
    const canAddPrefinancement = user?.userRole === UserRole.FINANCIAL_DIRECTOR;
    const canManagePrefinancement = user?.userRole === UserRole.ADMIN;

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

    // Fonction de confirmation personnalisée
    const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
        setConfirmDialog({
            show: true,
            title,
            message,
            onConfirm: () => {
                setConfirmDialog(prev => ({ ...prev, show: false }));
                onConfirm();
            },
            onCancel: () => {
                setConfirmDialog(prev => ({ ...prev, show: false }));
            }
        });
    };

    // Query keys
    const queryKey = (key: string) => [key, subsidiary.id];

    // Récupération des données avec React Query
    const { data: account, isLoading: isLoadingAccount } = useQuery<PrefinancementAccount>({
        queryKey: queryKey('prefinancementAccount'),
        queryFn: () => getPrefinancementAccount(subsidiary.id),
        enabled: !!subsidiary.id
    });

    const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<PrefinancementTransaction[]>({
        queryKey: queryKey('prefinancementTransactions'),
        queryFn: () => getPrefinancementTransactions({
            subsidiaryId: subsidiary.id
        }),
        enabled: !!subsidiary.id
    });

    const { data: statistics, isLoading: isLoadingStatistics } = useQuery<PrefinancementStatistics>({
        queryKey: queryKey('prefinancementStatistics'),
        queryFn: () => getPrefinancementStatistics(subsidiary.id),
        enabled: !!subsidiary.id
    });

    // Mutations
    const { mutate: createTransaction } = useMutation({
        mutationFn: (data: PrefinancementTransactionCreationWithSubsidiaryData) => 
            createPrefinancementTransaction(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKey('prefinancementTransactions') });
            queryClient.invalidateQueries({ queryKey: queryKey('prefinancementStatistics') });
            toast.success('Transaction créée', 'La transaction a été créée avec succès.');
            setShowAddForm(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error('Erreur de création', error.message || 'Une erreur est survenue lors de la création.');
        }
    });

    const { mutate: validateTransaction } = useMutation({
        mutationFn: validatePrefinancementTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKey('prefinancementAccount') });
            queryClient.invalidateQueries({ queryKey: queryKey('prefinancementTransactions') });
            queryClient.invalidateQueries({ queryKey: queryKey('prefinancementStatistics') });
            toast.success('Transaction validée', 'La transaction a été validée avec succès.');
        },
        onError: (error: any) => {
            toast.error('Erreur de validation', error.message || 'Une erreur est survenue lors de la validation.');
        }
    });

    const { mutate: cancelTransaction } = useMutation({
        mutationFn: cancelPrefinancementTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKey('prefinancementAccount') });
            queryClient.invalidateQueries({ queryKey: queryKey('prefinancementTransactions') });
            queryClient.invalidateQueries({ queryKey: queryKey('prefinancementStatistics') });
            toast.success('Transaction annulée', 'La transaction a été annulée avec succès.');
        },
        onError: (error: any) => {
            toast.error('Erreur d\'annulation', error.message || 'Une erreur est survenue lors de l\'annulation.');
        }
    });

    const { mutate: deleteTransaction } = useMutation({
        mutationFn: deletePrefinancementTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKey('prefinancementAccount') });
            queryClient.invalidateQueries({ queryKey: queryKey('prefinancementTransactions') });
            queryClient.invalidateQueries({ queryKey: queryKey('prefinancementStatistics') });
            toast.success('Transaction supprimée', 'La transaction a été supprimée avec succès.');
        },
        onError: (error: any) => {
            toast.error('Erreur de suppression', error.message || 'Une erreur est survenue lors de la suppression.');
        }
    });

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'VALIDE': return 'bg-green-100 text-green-800';
            case 'EN_ATTENTE': return 'bg-yellow-100 text-yellow-800';
            case 'ANNULE': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getTranslatedStatus = (status: string) => {
        switch (status) {
            case 'VALIDE': return 'Validé';
            case 'EN_ATTENTE': return 'En attente';
            case 'ANNULE': return 'Annulé';
            default: return status;
        }
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            'MATERIELS_PREMIER': 'Matières Premières',
            'MAIN_D_OEUVRE': 'Main d\'Œuvre',
            'ENERGIE': 'Énergie',
            'TRANSPORT': 'Transport',
            'AUTRE': 'Autre'
        };
        return labels[category] || category;
    };

    // Fonction utilitaire pour afficher les montants de manière sécurisée
    const formatAmountDisplay = (amount: number | null | undefined, type: 'CREDIT' | 'DEBIT') => {
        const validAmount = (amount !== null && amount !== undefined && !isNaN(amount)) ? amount : 0;
        const prefix = type === 'CREDIT' ? '+' : '-';
        return `${prefix}${formatCurrency(Number(validAmount))}`;
    };

    // Handlers
    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            description: '',
            amount: 0,
            type: 'DEBIT',
            category: 'MATERIELS_PREMIER',
            referenceNumber: '',
            relatedOrderId: '',
            notes: ''
        });
    };

    const handleCreateTransaction = () => {
        // Validation du montant pour éviter NaN
        const amount = formData.amount;
        const validAmount = (amount !== null && amount !== undefined && !isNaN(amount) && amount > 0) ? amount : 0;
        
        const transactionData: PrefinancementTransactionCreationWithSubsidiaryData = {
            ...formData,
            date: formData.date,
            amount: validAmount,
            subsidiaryId: subsidiary.id
        };
        createTransaction(transactionData);
    };



    const handlePrint = () => {
        window.print();
        toast.info('Impression lancée', 'La page est en cours d\'impression.');
    };

    const handleExport = () => {
        try {
            const headers = [
                { key: 'date', label: 'Date' },
                { key: 'referenceNumber', label: 'Référence' },
                { key: 'description', label: 'Description' },
                { key: 'category', label: 'Catégorie' },
                { key: 'type', label: 'Type' },
                { key: 'amount', label: 'Montant' },
                { key: 'status', label: 'Statut' },
            ];
            const data = filteredTransactions.map(tx => ({
                ...tx,
                date: new Date(tx.date).toLocaleDateString('fr-FR'),
                category: getCategoryLabel(tx.category),
                type: tx.type === 'CREDIT' ? 'Crédit' : 'Débit',
                status: getTranslatedStatus(tx.status),
                amount: formatAmountDisplay(tx.amount, tx.type)
            }));
            exportToCsv('prefinancement_transactions', headers, data);
            toast.success('Export CSV réussi!', 'Les données ont été exportées au format CSV.');
        } catch (error) {
            toast.error('Erreur d\'export', 'Une erreur est survenue lors de l\'export CSV.');
        }
    };

    const handleExportPdf = () => {
        try {
            const headers = [
                { key: 'date', label: 'Date' },
                { key: 'referenceNumber', label: 'Référence' },
                { key: 'description', label: 'Description' },
                { key: 'category', label: 'Catégorie' },
                { key: 'type', label: 'Type' },
                { key: 'amount', label: 'Montant' },
                { key: 'status', label: 'Statut' },
            ];
            const data = filteredTransactions.map(tx => ({
                ...tx,
                date: new Date(tx.date).toLocaleDateString('fr-FR'),
                category: getCategoryLabel(tx.category),
                type: tx.type === 'CREDIT' ? 'Crédit' : 'Débit',
                status: getTranslatedStatus(tx.status),
                amount: formatAmountDisplay(tx.amount, tx.type)
            }));
            exportToPdf('Transactions Préfinancement', headers, data, 'prefinancement');
            toast.success('Export PDF réussi!', 'Les données ont été exportées au format PDF.');
        } catch (error) {
            toast.error('Erreur d\'export', 'Une erreur est survenue lors de l\'export PDF.');
        }
    };

    const handleValidateTransaction = (transactionId: string) => {
        showConfirmDialog(
            'Confirmation de validation',
            'Êtes-vous sûr de vouloir valider cette transaction?',
            () => validateTransaction(transactionId)
        );
    };

    const handleRejectTransaction = (transactionId: string) => {
        showConfirmDialog(
            'Confirmation d\'annulation',
            'Êtes-vous sûr de vouloir annuler cette transaction?',
            () => cancelTransaction(transactionId)
        );
    };

    const handleDeleteTransaction = (transactionId: string) => {
        showConfirmDialog(
            'Confirmation de suppression',
            'Êtes-vous sûr de vouloir supprimer cette transaction?',
            () => deleteTransaction(transactionId)
        );
    };

    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(transaction => {
            const matchesFilter = filter === 'ALL' || transaction.type === filter;
            const matchesSearch = searchTerm === '' || 
                transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [transactions, filter, searchTerm]);

    const totalCredits = useMemo(() => {
        if (!transactions) return 0;
        return transactions
            .filter(t => t.type === 'CREDIT')
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions]);

    const totalDebits = useMemo(() => {
        if (!transactions) return 0;
        return transactions
            .filter(t => t.type === 'DEBIT')
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions]);

    const isLoading = isLoadingAccount || isLoadingTransactions || isLoadingStatistics;

    if (isLoading) {
        return <div className="p-6 text-center">{t('common.loading')}</div>;
    }

    return (
        <>
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
                    <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
                        <h4 className="font-semibold text-slate-500">Solde Actuel</h4>
                        <div className="flex-grow flex items-end mt-2">
                            <p className="text-3xl font-bold text-slate-800 whitespace-nowrap">
                                {account ? formatCurrency(account.balance) : formatCurrency(0)}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
                        <h4 className="font-semibold text-slate-500">Total Crédits</h4>
                        <div className="flex-grow flex items-end mt-2">
                            <p className="text-3xl font-bold text-green-600 whitespace-nowrap">
                                {statistics ? formatCurrency(statistics.totalCredits) : formatCurrency(0)}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
                        <h4 className="font-semibold text-slate-500">Total Débits</h4>
                        <div className="flex-grow flex items-end mt-2">
                            <p className="text-3xl font-bold text-red-600 whitespace-nowrap">
                                {formatCurrency(statistics?.totalDebits ?? 0)}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
                        <h4 className="font-semibold text-slate-500">Transactions</h4>
                        <div className="flex-grow flex items-end mt-2">
                            <p className="text-3xl font-bold text-slate-800 whitespace-nowrap">
                                {statistics ? statistics.transactionCount : 0}
                            </p>
                        </div>
                    </div>
                </div>

          {/* Formulaire d'ajout - seulement si directeur financier */}
                {showAddForm && canAddPrefinancement && (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-slate-800">Nouvelle Transaction de Préfinancement</h3>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="p-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
                            >
                                <XIcon className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input 
                                    type="date" 
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#c6e911] focus:border-transparent" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                <select 
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value as 'CREDIT' | 'DEBIT'})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#c6e911] focus:border-transparent"
                                >
                                    <option value="CREDIT">Crédit</option>
                                    <option value="DEBIT">Débit</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                                <select 
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#c6e911] focus:border-transparent"
                                >
                                    <option value="MATERIELS_PREMIER">Matières Premières</option>
                                    <option value="MAIN_D_OEUVRE">Main d'Œuvre</option>
                                    <option value="ENERGIE">Énergie</option>
                                    <option value="TRANSPORT">Transport</option>
                                    <option value="AUTRE">Autre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <input 
                                    type="text" 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#c6e911] focus:border-transparent" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Montant (XOF)</label>
                                <input 
                                    type="number" 
                                    value={formData.amount}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const parsedValue = parseFloat(value);
                                        setFormData({...formData, amount: isNaN(parsedValue) ? 0 : parsedValue});
                                    }}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#c6e911] focus:border-transparent" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de Référence</label>
                                <input 
                                    type="text" 
                                    value={formData.referenceNumber}
                                    onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#c6e911] focus:border-transparent" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Commande liée (optionnel)</label>
                                <input 
                                    type="text" 
                                    placeholder="CMD-..." 
                                    value={formData.relatedOrderId}
                                    onChange={(e) => setFormData({...formData, relatedOrderId: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#c6e911] focus:border-transparent" 
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                                <textarea 
                                    rows={3} 
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#c6e911] focus:border-transparent"
                                ></textarea>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <FormSecondaryButton onClick={() => setShowAddForm(false)}>
                                Annuler
                            </FormSecondaryButton>
                            <FormPrimaryButton onClick={handleCreateTransaction}>
                                Enregistrer
                            </FormPrimaryButton>
                        </div>
                    </div>
                )}

                {/* Tableau des transactions */}
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <h3 className="text-xl font-semibold text-slate-800">Transactions Préfinancement</h3>
                        {isLoadingTransactions && (
                            <div className="text-sm text-blue-600">Chargement...</div>
                        )}
                        <div className="text-sm text-slate-500">
                            {filteredTransactions.length} transaction(s) trouvée(s)
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 no-print self-start md:self-center">
                        {/* Filtres */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('ALL')}
                                className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                                    filter === 'ALL' 
                                        ? 'bg-[#c6e911] text-slate-800' 
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                }`}
                            >
                                Tout
                            </button>
                            <button
                                onClick={() => setFilter('CREDIT')}
                                className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                                    filter === 'CREDIT' 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                }`}
                            >
                                Crédits
                            </button>
                            <button
                                onClick={() => setFilter('DEBIT')}
                                className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                                    filter === 'DEBIT' 
                                        ? 'bg-red-500 text-white' 
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                }`}
                            >
                                Débits
                            </button>
                        </div>

                        {/* Recherche */}
                        <div className="relative">
                            <input
                                type="search"
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full md:w-48 pl-10 pr-4 py-2 border border-slate-300 rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Boutons d'action */}
                        {canAddPrefinancement && (
                            <PrimaryButton onClick={() => setShowAddForm(!showAddForm)}>
                                <PlusIcon />
                                <span>{showAddForm ? 'Annuler' : 'Ajouter'}</span>
                            </PrimaryButton>
                        )}
                        <SuccessButton onClick={handleExport}>
                            <DownloadIcon />
                            <span>CSV</span>
                        </SuccessButton>
                        <PrimaryButton onClick={handleExportPdf}>
                            <DownloadIcon />
                            <span>PDF</span>
                        </PrimaryButton>
                    </div>
                </div>

                {filteredTransactions.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Référence</th>
                                <th scope="col" className="px-6 py-3">Description</th>
                                <th scope="col" className="px-6 py-3">Catégorie</th>
                                <th scope="col" className="px-6 py-3">Type</th>
                                <th scope="col" className="px-6 py-3 text-right">Montant</th>
                                <th scope="col" className="px-6 py-3 text-center">Statut</th>
                                <th scope="col" className="px-6 py-3 text-center no-print">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map((transaction) => (
                                <tr key={transaction.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4">{new Date(transaction.date).toLocaleDateString('fr-FR')}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{transaction.referenceNumber || '-'}</td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-slate-800">{transaction.description}</div>
                                            {transaction.relatedOrderId && (
                                                <div className="text-xs text-slate-500">Commande: {transaction.relatedOrderId}</div>
                                            )}
                                            {transaction.notes && (
                                                <div className="text-xs text-slate-500 mt-1">{transaction.notes}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{getCategoryLabel(transaction.category)}</td>
                                    <td className={`px-6 py-4 font-semibold ${transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                                        {transaction.type === 'CREDIT' ? 'Crédit' : 'Débit'}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${transaction.type === 'CREDIT' ? 'text-green-700' : 'text-red-700'}`}>
                                        {transaction.type === 'CREDIT' ? '+' : '-'}{formatCurrency(Number(transaction.amount || 0))}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(transaction.status)}`}>
                                            {getTranslatedStatus(transaction.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center no-print">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* Bouton Valider - seulement si statut est EN_ATTENTE et utilisateur est admin */}
                                            {transaction.status === 'EN_ATTENTE' && canManagePrefinancement && (
                                                <IconButton
                                                    onClick={() => handleValidateTransaction(transaction.id)}
                                                    title="Valider"
                                                    className="hover:text-green-600 hover:bg-green-100"
                                                >
                                                    <CheckIcon />
                                                </IconButton>
                                            )}
                                            
                                            {/* Bouton Annuler - seulement si statut est VALIDATED et utilisateur est admin */}
                                            {transaction.status === 'VALIDE' && canManagePrefinancement && (
                                                <WarningIconButton
                                                    onClick={() => handleRejectTransaction(transaction.id)}
                                                    title="Annuler"
                                                >
                                                    <XIcon />
                                                </WarningIconButton>
                                            )}
                                            
                                            {/* Bouton Rejeter - seulement si statut est EN_ATTENTE et utilisateur est admin */}
                                            {transaction.status === 'EN_ATTENTE' && canManagePrefinancement && (
                                                <WarningIconButton
                                                    onClick={() => handleRejectTransaction(transaction.id)}
                                                    title="Rejeter"
                                                >
                                                    <XIcon />
                                                </WarningIconButton>
                                            )}
                                            
                                            {/* Bouton Supprimer - seulement si utilisateur est admin */}
                                            {canManagePrefinancement && (
                                                <DangerIconButton
                                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                                    title="Supprimer"
                                                >
                                                    <TrashIcon />
                                                </DangerIconButton>
                                            )}
                                            
                                         
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}
                
                {filteredTransactions.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        {searchTerm ? "Aucune transaction ne correspond à votre recherche." : "Aucune transaction trouvée."}
                    </div>
                )}
            </div>
            
            {/* Boîte de dialogue de confirmation personnalisée */}
            {confirmDialog.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            {confirmDialog.title}
                        </h3>
                        <p className="text-slate-600 mb-6">
                            {confirmDialog.message}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={confirmDialog.onCancel}
                                className="px-4 py-2 text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmDialog.onConfirm}
                                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default PrefinancementManagement;
