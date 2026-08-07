import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFinancialTransactions, validateTransaction } from '../../services/apiFinance/apiTreasury';
import { FinancialTransaction, TransactionStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/**
 * PendingTransactionsPanel — Visible uniquement par le SUPER_ADMIN.
 *
 * Affiche les transactions EN_ATTENTE issues des paiements bancaires
 * (Virement, Carte, Chèque) enregistrés à la Caisse.
 * Permet au SUPER_ADMIN de valider (PATCH status → VALIDE) chaque transaction,
 * ce qui applique le débit/crédit sur le compte bancaire et génère l'écriture comptable.
 */
const PendingTransactionsPanel: React.FC<{ subsidiaryId?: string }> = ({ subsidiaryId }) => {
    const { user } = useAuth();
    const toast = useToast();
    const queryClient = useQueryClient();
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const { data: allTransactions = [], isLoading } = useQuery<FinancialTransaction[]>({
        queryKey: ['financial-transactions', subsidiaryId],
        queryFn: () => getFinancialTransactions(subsidiaryId),
        enabled: true,
    });

    const pendingTransactions = allTransactions.filter(
        (tx) => tx.status === TransactionStatus.PENDING,
    );

    const { mutate: validate, isPending: isValidating } = useMutation({
        mutationFn: (id: string) => validateTransaction(id),
        onSuccess: (_, id) => {
            toast.success('Transaction validée', 'Le solde du compte a été mis à jour et l\'écriture comptable générée.');
            queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
            setConfirmId(null);
        },
        onError: (err: any) => {
            toast.error('Erreur de validation', err?.response?.data?.message || 'Une erreur est survenue.');
            setConfirmId(null);
        },
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-pulse">
                <div className="h-5 w-48 bg-slate-200 rounded mb-4" />
                {[1, 2].map((i) => <div key={i} className="h-16 bg-slate-100 rounded mb-3" />)}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                        <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Paiements bancaires en attente</h3>
                        <p className="text-xs text-slate-500">Transactions à valider pour application au compte</p>
                    </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    pendingTransactions.length > 0
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                }`}>
                    {pendingTransactions.length === 0 ? '✓ Tout à jour' : `${pendingTransactions.length} en attente`}
                </span>
            </div>

            {/* Body */}
            {pendingTransactions.length === 0 ? (
                <div className="py-12 flex flex-col items-center text-slate-400">
                    <svg className="h-10 w-10 mb-2 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium">Aucune transaction en attente</p>
                    <p className="text-xs mt-0.5">Tous les paiements bancaires ont été validés</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-50">
                    {pendingTransactions.map((tx) => (
                        <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 truncate">{tx.description}</p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                    <span className="text-xs text-slate-500">{formatDate(tx.transactionDate)}</span>
                                    {tx.reference && (
                                        <span className="text-xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                            Réf: {tx.reference}
                                        </span>
                                    )}
                                    {tx.relatedDocumentId && (
                                        <span className="text-xs text-blue-500">
                                            {tx.relatedDocumentId}
                                        </span>
                                    )}
                                    {tx.treasuryAccount && (
                                        <span className="text-xs text-slate-400">
                                            → {tx.treasuryAccount.accountName}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-sm font-bold text-slate-900">
                                    {formatCurrency(tx.amount)}
                                </span>

                                {confirmId === tx.id ? (
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => validate(tx.id)}
                                            disabled={isValidating}
                                            className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                        >
                                            {isValidating ? '...' : 'Confirmer'}
                                        </button>
                                        <button
                                            onClick={() => setConfirmId(null)}
                                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmId(tx.id)}
                                        className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                                    >
                                        Valider
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingTransactionsPanel;
