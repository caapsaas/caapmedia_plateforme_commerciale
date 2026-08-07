import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AccountType, CounterpartyType, TreasuryAccount, TreasuryTransactionType } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { getTreasuryAccounts, getCounterparties, createDisbursement } from '../../services/apiFinance/apiTreasury';
import { getSuppliers } from '../../services/apiPurchasing/apiSupplier';
import { getSubsidiaries } from '../../services/apiCommon/apiSubsidiaries';
import {
  getIrppDetail,
  getCnpsDetail,
  getCfcFneDetail,
  getVatDetail,
} from '../../services/apiFinance/apiTaxTransparency';

interface SafeDisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Types nécessitant une période fiscale (mois/année) — montant auto-calculé
// et en lecture seule, comme gmo (IUTS/CNSS/TPA/ROSALAIRE), adaptés à la
// nomenclature camerounaise déjà en place dans le module Fiscalité & Paie.
const TAX_PERIOD_TYPES = [
  TreasuryTransactionType.IRPP_PAYMENT,
  TreasuryTransactionType.CNPS_PAYMENT,
  TreasuryTransactionType.CFC_FNE_PAYMENT,
  TreasuryTransactionType.TVA_PAYMENT,
];

const TRANSFER_TYPES = [TreasuryTransactionType.BANK_WITHDRAWAL, TreasuryTransactionType.CASH_REFILL];

// Décaissement depuis le Coffre-fort — réservé au SUPER_ADMIN (voir
// Disbursement.tsx), calqué sur Frontend_GMO/components/analytics/SafeDisbursementModal.tsx :
// le formulaire change selon le type d'opération sélectionné (bénéficiaire,
// période fiscale, compte destination...).
const SafeDisbursementModal: React.FC<SafeDisbursementModalProps> = ({ isOpen, onClose }) => {
  const { t, formatCurrency } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sourceAccountId, setSourceAccountId] = useState('');
  const [treasuryType, setTreasuryType] = useState<TreasuryTransactionType>(TreasuryTransactionType.SUPPLIER_PAYMENT);
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [supplierCounterpartyId, setSupplierCounterpartyId] = useState('');
  const [taxSubsidiaryId, setTaxSubsidiaryId] = useState('');
  const [taxMonth, setTaxMonth] = useState(new Date().getMonth() + 1);
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');

  const isTransfer = TRANSFER_TYPES.includes(treasuryType);
  const isTaxPeriodType = TAX_PERIOD_TYPES.includes(treasuryType);
  const isSupplierPayment = treasuryType === TreasuryTransactionType.SUPPLIER_PAYMENT;

  const resetForm = () => {
    setSourceAccountId('');
    setTreasuryType(TreasuryTransactionType.SUPPLIER_PAYMENT);
    setDestinationAccountId('');
    setSupplierCounterpartyId('');
    setTaxSubsidiaryId('');
    setTaxMonth(new Date().getMonth() + 1);
    setTaxYear(new Date().getFullYear());
    setAmount('');
    setDescription('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setReference('');
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  // Pas de filtre filiale : le coffre-fort et les banques sont centralisés
  // au siège, mais la caisse dépense destination d'une alimentation peut
  // appartenir à n'importe quelle filiale — le SUPER_ADMIN a une vue globale.
  const { data: accounts = [] } = useQuery<TreasuryAccount[]>({
    queryKey: ['treasuryAccounts', 'all'],
    queryFn: () => getTreasuryAccounts(),
    enabled: isOpen,
  });

  const { data: subsidiaries = [] } = useQuery({
    queryKey: ['subsidiaries-list'],
    queryFn: getSubsidiaries,
    enabled: isOpen,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
    enabled: isOpen && isSupplierPayment,
  });

  const { data: taxCounterparties = [] } = useQuery({
    queryKey: ['counterparties', CounterpartyType.TAX_AUTHORITY],
    queryFn: () => getCounterparties(CounterpartyType.TAX_AUTHORITY),
    enabled: isOpen && isTaxPeriodType,
  });

  const safes = useMemo(() => accounts.filter((a) => a.accountType === AccountType.SAFE), [accounts]);
  const bankAccounts = useMemo(() => accounts.filter((a) => a.accountType === AccountType.BANQUE), [accounts]);
  const expenseBoxes = useMemo(() => accounts.filter((a) => a.accountType === AccountType.EXPENSE_BOX), [accounts]);

  const taxPeriodParams = { month: taxMonth, year: taxYear, subsidiaryId: taxSubsidiaryId || undefined };

  const { data: irppDetail } = useQuery({
    queryKey: ['irppDetail', taxPeriodParams],
    queryFn: () => getIrppDetail(taxPeriodParams),
    enabled: isOpen && treasuryType === TreasuryTransactionType.IRPP_PAYMENT,
  });
  const { data: cnpsDetail } = useQuery({
    queryKey: ['cnpsDetail', taxPeriodParams],
    queryFn: () => getCnpsDetail(taxPeriodParams),
    enabled: isOpen && treasuryType === TreasuryTransactionType.CNPS_PAYMENT,
  });
  const { data: cfcFneDetail } = useQuery({
    queryKey: ['cfcFneDetail', taxPeriodParams],
    queryFn: () => getCfcFneDetail(taxPeriodParams),
    enabled: isOpen && treasuryType === TreasuryTransactionType.CFC_FNE_PAYMENT,
  });
  const { data: vatDetail } = useQuery({
    queryKey: ['vatDetail', taxPeriodParams],
    queryFn: () => getVatDetail(taxPeriodParams),
    enabled: isOpen && treasuryType === TreasuryTransactionType.TVA_PAYMENT,
  });

  // Montant + description auto-calculés (lecture seule) pour les versements
  // fiscaux/sociaux — même principe que gmo.
  useEffect(() => {
    if (treasuryType === TreasuryTransactionType.IRPP_PAYMENT && irppDetail) {
      setAmount(String(irppDetail.totalAmount));
      setDescription(t('safeDisbursement.descriptions.irpp', { month: taxMonth, year: taxYear }));
    } else if (treasuryType === TreasuryTransactionType.CNPS_PAYMENT && cnpsDetail) {
      setAmount(String(cnpsDetail.total));
      setDescription(t('safeDisbursement.descriptions.cnps', { month: taxMonth, year: taxYear }));
    } else if (treasuryType === TreasuryTransactionType.CFC_FNE_PAYMENT && cfcFneDetail) {
      setAmount(String(cfcFneDetail.cfc.totalAmount + cfcFneDetail.fne.totalAmount));
      setDescription(t('safeDisbursement.descriptions.cfcFne', { month: taxMonth, year: taxYear }));
    } else if (treasuryType === TreasuryTransactionType.TVA_PAYMENT && vatDetail) {
      const total = vatDetail.details.reduce((sum, d) => sum + d.vatAmount, 0);
      setAmount(String(total));
      setDescription(t('safeDisbursement.descriptions.tva', { month: taxMonth, year: taxYear }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treasuryType, irppDetail, cnpsDetail, cfcFneDetail, vatDetail, taxMonth, taxYear]);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () =>
      createDisbursement({
        transactionDate,
        description,
        amount: parseFloat(amount) || 0,
        sourceAccountId,
        destinationAccountId: isTransfer ? destinationAccountId : undefined,
        treasuryType,
        reference: reference || undefined,
        counterpartyId: isSupplierPayment ? supplierCounterpartyId || undefined : isTaxPeriodType ? taxCounterparties[0]?.id : undefined,
        newCounterpartyName: isSupplierPayment && !supplierCounterpartyId ? undefined : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasuryAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['financialTransactions'] });
      toast('success', t('safeDisbursement.success'));
      onClose();
    },
    onError: (error: any) => {
      toast('error', error?.response?.data?.message || t('common.error'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceAccountId || !amount || parseFloat(amount) <= 0 || !description) return;
    if (isTransfer && !destinationAccountId) return;
    submit();
  };

  if (!isOpen) return null;

  const selectedSource = safes.find((a) => a.id === sourceAccountId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b bg-gradient-to-r from-[#c6e911]/15 to-white">
          <h3 className="text-lg font-bold text-slate-800">{t('safeDisbursement.title')}</h3>
          <p className="text-sm text-slate-600 mt-1">{t('safeDisbursement.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.sourceSafe')}</label>
            <select
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              required
              className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border"
            >
              <option value="">{t('safeDisbursement.selectSafe')}</option>
              {safes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.accountName} — {formatCurrency(s.balance)}
                </option>
              ))}
            </select>
            {selectedSource && parseFloat(amount || '0') > selectedSource.balance && (
              <p className="mt-1 text-xs text-red-600">{t('safeDisbursement.insufficientBalance', { balance: formatCurrency(selectedSource.balance) })}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.operationType')}</label>
            <select
              value={treasuryType}
              onChange={(e) => {
                setTreasuryType(e.target.value as TreasuryTransactionType);
                setDestinationAccountId('');
                setAmount('');
                setDescription('');
              }}
              required
              className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border bg-white"
            >
              <option value={TreasuryTransactionType.SUPPLIER_PAYMENT}>{t('safeDisbursement.types.SUPPLIER_PAYMENT')}</option>
              <option value={TreasuryTransactionType.BANK_WITHDRAWAL}>{t('safeDisbursement.types.BANK_WITHDRAWAL')}</option>
              <option value={TreasuryTransactionType.CASH_REFILL}>{t('safeDisbursement.types.CASH_REFILL')}</option>
              <option value={TreasuryTransactionType.SALARY_PAYMENT}>{t('safeDisbursement.types.SALARY_PAYMENT')}</option>
              <option value={TreasuryTransactionType.BONUS_PAYMENT}>{t('safeDisbursement.types.BONUS_PAYMENT')}</option>
              <option value={TreasuryTransactionType.IRPP_PAYMENT}>{t('safeDisbursement.types.IRPP_PAYMENT')}</option>
              <option value={TreasuryTransactionType.CNPS_PAYMENT}>{t('safeDisbursement.types.CNPS_PAYMENT')}</option>
              <option value={TreasuryTransactionType.CFC_FNE_PAYMENT}>{t('safeDisbursement.types.CFC_FNE_PAYMENT')}</option>
              <option value={TreasuryTransactionType.TVA_PAYMENT}>{t('safeDisbursement.types.TVA_PAYMENT')}</option>
              <option value={TreasuryTransactionType.OTHER_EXPENSE}>{t('safeDisbursement.types.OTHER_EXPENSE')}</option>
            </select>
          </div>

          {treasuryType === TreasuryTransactionType.BANK_WITHDRAWAL && (
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.destinationBank')}</label>
              <select value={destinationAccountId} onChange={(e) => setDestinationAccountId(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border bg-white">
                <option value="">{t('safeDisbursement.selectBank')}</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.accountName} ({formatCurrency(acc.balance)})</option>
                ))}
              </select>
            </div>
          )}

          {treasuryType === TreasuryTransactionType.CASH_REFILL && (
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.destinationExpenseBox')}</label>
              <select value={destinationAccountId} onChange={(e) => setDestinationAccountId(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border bg-white">
                <option value="">{t('safeDisbursement.selectExpenseBox')}</option>
                {expenseBoxes.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                ))}
              </select>
            </div>
          )}

          {isSupplierPayment && (
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.beneficiarySupplier')}</label>
              <select value={supplierCounterpartyId} onChange={(e) => setSupplierCounterpartyId(e.target.value)} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border bg-white">
                <option value="">{t('safeDisbursement.selectSupplier')}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.supplierName}</option>
                ))}
              </select>
            </div>
          )}

          {isTaxPeriodType && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('safeDisbursement.month')}</label>
                  <select value={taxMonth} onChange={(e) => setTaxMonth(Number(e.target.value))} className="w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border bg-white">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{t(`safeDisbursement.months.${m}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('safeDisbursement.year')}</label>
                  <select value={taxYear} onChange={(e) => setTaxYear(Number(e.target.value))} className="w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border bg-white">
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('safeDisbursement.subsidiary')}</label>
                <select value={taxSubsidiaryId} onChange={(e) => setTaxSubsidiaryId(e.target.value)} className="w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border bg-white">
                  <option value="">{t('safeDisbursement.allSubsidiaries')}</option>
                  {subsidiaries.map((s) => (
                    <option key={s.id} value={s.id}>{s.subsidiaryName}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-amber-600">{t('safeDisbursement.taxHint')}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.amount')}</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                readOnly={isTaxPeriodType}
                required
                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border read-only:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.date')}</label>
              <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.description')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              readOnly={isTaxPeriodType}
              required
              className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border read-only:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.reference')}</label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-[#231F20] text-white rounded-md hover:bg-slate-700 transition-colors disabled:opacity-50">
              {isPending ? t('safeDisbursement.submitting') : t('safeDisbursement.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SafeDisbursementModal;
