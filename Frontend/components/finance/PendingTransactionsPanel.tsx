import Pagination from '../common/Pagination';
import { useClientPagination } from '../../hooks/useClientPagination';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFinancialTransactions, validateTransaction } from '../../services/apiFinance/apiTreasury';
import { AccountType, FinancialTransaction, TransactionStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/**
 * PendingTransactionsPanel — Visible uniquement par le SUPER_ADMIN.
 *
 * Affiche les transactions EN_ATTENTE issues des paiements bancaires
 * (Virement, Carte, Chèque) enregistrés à la Caisse.
 * Un SUPER_ADMIN différent de l’auteur peut valider ou annuler l’opération.
 * La validation applique le mouvement et génère l’écriture comptable.
 */
const PendingTransactionsPanel: React.FC<{ subsidiaryId?: string }> = ({ subsidiaryId }) => {
    const { user } = useAuth();
    const toast = useToast();
    const queryClient = useQueryClient();
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [bankFeesMap, setBankFeesMap] = useState<Record<string, string>>({});
    const [reasonMap, setReasonMap] = useState<Record<string, string>>({});

    const { data: allTransactions = [], isLoading } = useQuery<FinancialTransaction[]>({
        queryKey: ['financial-transactions', subsidiaryId],
        queryFn: () => getFinancialTransactions(subsidiaryId),
        enabled: true,
    });

    const pendingTransactions = allTransactions.filter(
        (tx) =>
            tx.status === TransactionStatus.PENDING &&
            (tx.treasuryAccount?.accountType === AccountType.BANQUE ||
                tx.destinationAccount?.accountType === AccountType.BANQUE ||
                (tx.treasuryAccount?.accountType === AccountType.SAFE && tx.destinationAccountId) ||
                tx.treasuryAccount?.accountType === AccountType.SAFE),
    );

    const { mutate: validate, isPending: isValidating } = useMutation({
        mutationFn: ({ id, status, bankFees, reason }: { id: string; status: TransactionStatus; bankFees?: number; reason?: string }) =>
            validateTransaction(id, status, { bankFees, reason }),
        onSuccess: (_, { status }) => {
            toast.success(
                status === TransactionStatus.CANCELLED ? 'Opération annulée' : 'Transaction validée',
                status === TransactionStatus.CANCELLED
                    ? 'L’opération a été annulée sans modifier le solde bancaire.'
                    : 'Le compte a été mis à jour et l’écriture comptable générée.',
            );
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

    const { pageItems, meta, setPage } = useClientPagination(pendingTransactions);

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
                    {pageItems.map((tx) => {
                        const isOpeningBalanceReceipt =
                            tx.description === 'Solde initial' &&
                            tx.reference === `INIT-${tx.treasuryAccountId}`;
                        const isBankOperation = tx.treasuryAccount?.accountType === AccountType.BANQUE ||
                            tx.destinationAccount?.accountType === AccountType.BANQUE;
                        const selfApprovalBlocked =
                            isBankOperation && tx.createdByUserId === user?.id && !isOpeningBalanceReceipt;
                        return (
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
                                            Source : {tx.treasuryAccount.accountName}
                                        </span>
                                    )}
                                    {tx.destinationAccount && (
                                        <span className="text-xs text-slate-400">
                                            Destination : {tx.destinationAccount.accountName}
                                        </span>
                                    )}
                                    {tx.counterparty && (
                                        <span className="text-xs text-slate-400">
                                            Bénéficiaire : {tx.counterparty.name}
                                        </span>
                                    )}
                                    {selfApprovalBlocked && (
                                        <span className="text-xs font-semibold text-amber-700">
                                            Vous avez créé cette opération ; un autre super-admin doit la traiter.
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-sm font-bold text-slate-900">
                                    {formatCurrency(tx.amount)}
                                </span>

                                {confirmId === tx.id ? (
                                    <div className="flex flex-col items-end gap-2">
                                        {tx.financialTransactionType === 'RECETTE' && isBankOperation && (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={bankFeesMap[tx.id] ?? ''}
                                                    onChange={(e) => setBankFeesMap((prev) => ({ ...prev, [tx.id]: e.target.value }))}
                                                    placeholder="Frais bancaires (FCFA)"
                                                    className="w-40 px-2 py-1 text-xs border border-slate-300 rounded"
                                                />
                                                <input
                                                    type="text"
                                                    value={reasonMap[tx.id] ?? ''}
                                                    onChange={(e) => setReasonMap((prev) => ({ ...prev, [tx.id]: e.target.value }))}
                                                    placeholder="Motif si rejet/impayé"
                                                    className="w-44 px-2 py-1 text-xs border border-slate-300 rounded"
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => {
                                                    const rawFees = parseFloat(bankFeesMap[tx.id] ?? '');
                                                    validate({
                                                        id: tx.id,
                                                        status: TransactionStatus.VALIDATED,
                                                        ...(Number.isFinite(rawFees) && rawFees > 0 ? { bankFees: rawFees } : {}),
                                                    });
                                                }}
                                                disabled={isValidating || selfApprovalBlocked}
                                                className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                            >
                                                {isValidating ? '...' : 'Confirmer'}
                                            </button>
                                            {isBankOperation && <button
                                                onClick={() => {
                                                    const reason = (reasonMap[tx.id] ?? '').trim();
                                                    if (tx.financialTransactionType === 'RECETTE' && !reason) {
                                                        toast.error('Motif requis', 'Saisissez le motif du rejet bancaire ou chèque impayé.');
                                                        return;
                                                    }
                                                    validate({ id: tx.id, status: TransactionStatus.CANCELLED, ...(reason ? { reason } : {}) });
                                                }}
                                                disabled={isValidating || selfApprovalBlocked}
                                                className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors"
                                            >
                                                Refuser
                                            </button>}
                                            <button
                                                onClick={() => setConfirmId(null)}
                                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmId(tx.id)}
                                        disabled={selfApprovalBlocked}
                                        className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                                    >
                                        Valider
                                    </button>
                                )}
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
            <Pagination meta={meta} onPageChange={setPage} />
        </div>
    );
};

export default PendingTransactionsPanel;
