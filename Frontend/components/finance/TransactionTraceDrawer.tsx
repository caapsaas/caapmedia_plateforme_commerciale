import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import SlideOverDrawer from '../common/SlideOverDrawer';
import { FinancialTransaction, TransactionStatus, UserRole } from '../../types';
import { attachTransactionProof, reverseTransaction } from '../../services/apiFinance/apiTreasury';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getImageUrl } from '../../utils/imageUtils';

interface TransactionTraceDrawerProps {
  transaction: FinancialTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const TransactionTraceDrawer: React.FC<TransactionTraceDrawerProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const { t, formatCurrency, language } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const activeRole = user?.activeRole ?? user?.userRole;

  const [reversalReason, setReversalReason] = useState('');
  const [showReversalForm, setShowReversalForm] = useState(false);

  const canReverse =
    (activeRole === UserRole.SUPER_ADMIN || activeRole === UserRole.FINANCIAL_DIRECTOR) &&
    transaction?.status === TransactionStatus.VALIDATED &&
    !transaction?.isReversed;

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['financialTransactions'] }),
      queryClient.invalidateQueries({ queryKey: ['accountTransactions'] }),
      queryClient.invalidateQueries({ queryKey: ['treasuryAccounts'] }),
      queryClient.invalidateQueries({ queryKey: ['pendingTransactions'] }),
    ]);
  };

  const reverseMutation = useMutation({
    mutationFn: () => reverseTransaction(transaction!.id, reversalReason.trim()),
    onSuccess: async () => {
      await invalidateAll();
      toast.success(t('treasury.trace.reverseSuccess'));
      setReversalReason('');
      setShowReversalForm(false);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('common.error'));
    },
  });

  const proofMutation = useMutation({
    mutationFn: (file: File) => attachTransactionProof(transaction!.id, file),
    onSuccess: async () => {
      await invalidateAll();
      toast.success(t('treasury.trace.proofSuccess'));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('common.error'));
    },
  });

  if (!transaction) return null;

  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString(language) : '—';

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('treasury.trace.title')}
      subtitle={`${transaction.reference || transaction.id}`}
      size="lg"
    >
      <div className="space-y-5 text-sm">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase text-slate-500">
              {t('treasury.description')}
            </span>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
              {transaction.status || '—'}
            </span>
          </div>
          <p className="font-semibold text-slate-900">{transaction.description}</p>
          <div className="flex items-baseline justify-between pt-2 border-t border-slate-200">
            <span className="text-xs text-slate-500">{t('treasury.amount')}</span>
            <span className="text-lg font-bold tabular-nums text-slate-900">
              {formatCurrency(Number(transaction.amount))}
            </span>
          </div>
          {transaction.feesAmount != null && Number(transaction.feesAmount) > 0 && (
            <div className="flex justify-between text-xs text-slate-600">
              <span>{t('treasury.trace.bankFees')}</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(Number(transaction.feesAmount))}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 p-3 space-y-1">
            <p className="text-xs font-semibold uppercase text-slate-500">
              {t('treasury.trace.sourceBalances')}
            </p>
            <p className="text-xs text-slate-600">
              {transaction.treasuryAccount?.accountName || transaction.treasuryAccountId}
            </p>
            <div className="flex justify-between text-xs pt-1">
              <span>{t('treasury.history.balanceBefore')}:</span>
              <span className="font-semibold tabular-nums">
                {transaction.balanceBeforeSource != null
                  ? formatCurrency(Number(transaction.balanceBeforeSource))
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>{t('treasury.history.balanceAfter')}:</span>
              <span className="font-semibold tabular-nums">
                {transaction.balanceAfterSource != null
                  ? formatCurrency(Number(transaction.balanceAfterSource))
                  : '—'}
              </span>
            </div>
          </div>

          {transaction.destinationAccountId && (
            <div className="rounded-lg border border-slate-200 p-3 space-y-1">
              <p className="text-xs font-semibold uppercase text-slate-500">
                {t('treasury.trace.destBalances')}
              </p>
              <p className="text-xs text-slate-600">
                {transaction.destinationAccount?.accountName || transaction.destinationAccountId}
              </p>
              <div className="flex justify-between text-xs pt-1">
                <span>{t('treasury.history.balanceBefore')}:</span>
                <span className="font-semibold tabular-nums">
                  {transaction.balanceBeforeDest != null
                    ? formatCurrency(Number(transaction.balanceBeforeDest))
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>{t('treasury.history.balanceAfter')}:</span>
                <span className="font-semibold tabular-nums">
                  {transaction.balanceAfterDest != null
                    ? formatCurrency(Number(transaction.balanceAfterDest))
                    : '—'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase text-slate-500">
            {t('treasury.trace.actors')}
          </p>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">{t('treasury.trace.createdBy')}:</span>
            <span className="font-medium text-slate-800">
              {transaction.createdByUser?.userName || transaction.createdByUserId || '—'}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">{t('treasury.trace.approvedBy')}:</span>
            <span className="font-medium text-slate-800">
              {transaction.approvedByUser?.userName || transaction.approvedByUserId || '—'}{' '}
              ({fmtDate(transaction.approvedAt)})
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">{t('treasury.trace.journalEntry')}:</span>
            <span className="font-mono text-slate-800">
              {transaction.journalEntryReference || '—'}
            </span>
          </div>
          {transaction.rejectionReason && (
            <div className="mt-2 rounded bg-rose-50 p-2 text-xs text-rose-700">
              <strong>{t('treasury.trace.rejectionReason')}:</strong> {transaction.rejectionReason}
            </div>
          )}
          {transaction.isReversed && (
            <div className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-800">
              <strong>{t('treasury.trace.reversedNotice')}:</strong>{' '}
              {transaction.reversalReason || '—'} ({fmtDate(transaction.reversedAt)})
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase text-slate-500">
              {t('treasury.trace.proof')}
            </p>
            <label className="cursor-pointer rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
              {proofMutation.isPending ? t('common.saving') : t('treasury.trace.uploadProof')}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                disabled={proofMutation.isPending}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) proofMutation.mutate(file);
                }}
              />
            </label>
          </div>
          {transaction.proofFilePath ? (
            <a
              href={getImageUrl(transaction.proofFilePath)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-medium text-blue-600 hover:underline"
            >
              {t('treasury.trace.viewProof')}
            </a>
          ) : (
            <p className="text-xs text-slate-400">{t('treasury.trace.noProof')}</p>
          )}
        </div>

        {canReverse && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
            {!showReversalForm ? (
              <button
                type="button"
                onClick={() => setShowReversalForm(true)}
                className="rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50"
              >
                {t('treasury.trace.reverseButton')}
              </button>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('treasury.trace.reverseReasonLabel')}
                </label>
                <textarea
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  rows={2}
                  placeholder={t('treasury.trace.reverseReasonPlaceholder')}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReversalForm(false)}
                    className="rounded-md bg-slate-200 px-3 py-1.5 text-xs text-slate-700"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={reverseMutation.isPending || reversalReason.trim().length < 5}
                    onClick={() => reverseMutation.mutate()}
                    className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {reverseMutation.isPending ? t('common.saving') : t('treasury.trace.confirmReverse')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SlideOverDrawer>
  );
};

export default TransactionTraceDrawer;
