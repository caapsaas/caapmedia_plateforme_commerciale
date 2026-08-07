import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CashRemittance, CashRemittanceStatus, UserRole, TreasuryAccount, AccountType } from '../../types';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getCashRemittances,
  createCashRemittance,
  receiveCashRemittance,
} from '../../services/apiFinance/apiCashRemittance';
import { getTreasuryAccounts } from '../../services/apiFinance/apiTreasury';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';

const STATUS_STYLES: Record<CashRemittanceStatus, string> = {
  [CashRemittanceStatus.SUBMITTED]: 'bg-blue-100 text-blue-800',
  [CashRemittanceStatus.RECEIVED]: 'bg-green-100 text-green-800',
  [CashRemittanceStatus.RECEIVED_WITH_DISCREPANCY]: 'bg-orange-100 text-orange-800',
  [CashRemittanceStatus.REJECTED]: 'bg-red-100 text-red-800',
};

// Remise de caisse : le caissier déclare le contenu de sa caisse à remettre
// (toujours vers le coffre-fort du siège, résolu côté backend) ; le
// Directeur Financier de sa filiale réceptionne et confirme le comptage —
// même logique que gmo (CashRemittanceManagement.tsx), sans la capture de
// signature manuscrite (hors périmètre de cette parité).
const CashRemittanceManagement: React.FC = () => {
  const { t, formatCurrency } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const activeRole = user?.activeRole ?? user?.userRole;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [receivingRemittance, setReceivingRemittance] = useState<CashRemittance | null>(null);
  const [declaredAmount, setDeclaredAmount] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [notes, setNotes] = useState('');

  const { data: remittances = [], isLoading } = useQuery<CashRemittance[]>({
    queryKey: ['cashRemittances'],
    queryFn: getCashRemittances,
  });

  const { data: accounts = [] } = useQuery<TreasuryAccount[]>({
    queryKey: ['treasury-accounts', user?.subsidiaryId],
    queryFn: () => getTreasuryAccounts(user?.subsidiaryId),
    enabled: !!user,
  });

  const myCashRegister = React.useMemo(
    () => accounts.find((a) => a.accountType === AccountType.CASH_REGISTER && a.cashierId === user?.id),
    [accounts, user?.id],
  );

  const onError = (error: any) => {
    toast('error', error?.response?.data?.message || t('common.error'));
  };

  const resetForm = () => {
    setDeclaredAmount('');
    setReceivedAmount('');
    setNotes('');
  };

  const { mutate: submitCreate, isPending: isCreating } = useMutation({
    mutationFn: () =>
      createCashRemittance({
        declaredAmount: parseFloat(declaredAmount) || 0,
        remittanceDate: new Date().toISOString(),
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast('success', t('cashRemittance.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['cashRemittances'] });
      setShowCreateModal(false);
      resetForm();
    },
    onError,
  });

  const { mutate: submitReceive, isPending: isReceiving } = useMutation({
    mutationFn: () =>
      receiveCashRemittance(receivingRemittance!.id, {
        receivedAmount: parseFloat(receivedAmount) || 0,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast('success', t('cashRemittance.receiveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['cashRemittances'] });
      setReceivingRemittance(null);
      resetForm();
    },
    onError,
  });

  const openReceiveModal = (remittance: CashRemittance) => {
    setReceivingRemittance(remittance);
    setReceivedAmount(remittance.declaredAmount.toString());
    setNotes('');
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{t('cashRemittance.title')}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{t('cashRemittance.subtitle')}</p>
        </div>
        {activeRole === UserRole.CAISSIER && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors"
          >
            {t('cashRemittance.new')}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50">
            <tr>
              <th className="px-4 py-3">{t('cashRemittance.table.reference')}</th>
              <th className="px-4 py-3">{t('cashRemittance.table.date')}</th>
              <th className="px-4 py-3">{t('cashRemittance.table.cashier')}</th>
              <th className="px-4 py-3">Caisse</th>
              <th className="px-4 py-3 text-right">{t('cashRemittance.table.declared')}</th>
              <th className="px-4 py-3 text-right">{t('cashRemittance.table.received')}</th>
              <th className="px-4 py-3 text-center">{t('cashRemittance.table.status')}</th>
              <th className="px-4 py-3 text-center">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton rows={5} columns={8} />
            ) : remittances.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState icon="finance" title={t('cashRemittance.noData')} />
                </td>
              </tr>
            ) : (
              remittances.map((r) => (
                <tr key={r.id} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.reference}</td>
                  <td className="px-4 py-3">{new Date(r.remittanceDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{r.createdByUser?.userName || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-2 py-1 rounded">
                      {r.sourceCashRegister?.accountName || 'Caisse'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(r.declaredAmount)}</td>
                  <td className="px-4 py-3 text-right">
                    {r.receivedAmount != null ? formatCurrency(r.receivedAmount) : '-'}
                    {!!r.discrepancy && (
                      <span className="block text-xs text-red-600">
                        ({r.discrepancy > 0 ? '+' : ''}
                        {formatCurrency(r.discrepancy)})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[r.status]}`}>
                      {t(`cashRemittance.status.${r.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.status === CashRemittanceStatus.SUBMITTED && activeRole === UserRole.FINANCIAL_DIRECTOR && (
                      <button
                        onClick={() => openReceiveModal(r)}
                        className="text-xs font-semibold text-[#8a9c0a] hover:text-[#6d7a08] hover:underline"
                      >
                        {t('cashRemittance.receive')}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900">{t('cashRemittance.new')}</h3>
              <div className="mt-4 space-y-4">
                {myCashRegister ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Caisse d'origine :</span>
                      <span className="font-bold text-slate-800">{myCashRegister.accountName}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Solde disponible en caisse :</span>
                      <span className="font-bold text-green-700">{formatCurrency(myCashRegister.balance)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    ⚠️ <strong>Aucune caisse de vente ne vous est assignée.</strong><br />
                    Veuillez contacter un administrateur pour vous attribuer une caisse dans <em>Configuration &gt; Trésorerie</em>.
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('cashRemittance.form.declaredAmount')}</label>
                  <input
                    type="number"
                    min="0"
                    max={myCashRegister?.balance || 0}
                    step="0.01"
                    value={declaredAmount}
                    onChange={(e) => setDeclaredAmount(e.target.value)}
                    disabled={!myCashRegister}
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('cashRemittance.form.notes')}</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!myCashRegister}
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={() => submitCreate()}
                disabled={isCreating || !declaredAmount || !myCashRegister}
                className="px-4 py-2 bg-[#c6e911] text-slate-800 font-bold rounded-md hover:bg-[#adc40f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? t('common.saving') : t('cashRemittance.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {receivingRemittance && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={() => setReceivingRemittance(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900">
                {t('cashRemittance.receiveTitle', { reference: receivingRemittance.reference })}
              </h3>
              <div className="mt-4 space-y-4">
                <div className="bg-slate-50 p-3 rounded space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Caisse d'origine:</span>
                    <span className="font-semibold text-slate-700">{receivingRemittance.sourceCashRegister?.accountName || 'Caisse'}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-slate-500">{t('cashRemittance.form.declaredByAgent')}:</span>
                    <span className="text-base font-bold text-slate-900">{formatCurrency(receivingRemittance.declaredAmount)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('cashRemittance.form.receivedAmount')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border font-bold text-lg focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911]"
                  />
                  {parseFloat(receivedAmount || '0') !== receivingRemittance.declaredAmount && (
                    <p className="text-sm text-red-600 mt-1">
                      {t('cashRemittance.form.discrepancyWarning', {
                        amount: formatCurrency((parseFloat(receivedAmount) || 0) - receivingRemittance.declaredAmount),
                      })}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('cashRemittance.form.receptionNotes')}</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911]"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
              <button onClick={() => setReceivingRemittance(null)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={() => submitReceive()}
                disabled={isReceiving || !receivedAmount}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isReceiving ? t('common.saving') : t('cashRemittance.confirmReceive')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRemittanceManagement;
