import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AccountType, CounterpartyType, SupplierDebt, TreasuryAccount, TreasuryTransactionType } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { getTreasuryAccounts, getCounterparties, createDisbursement } from '../../services/apiFinance/apiTreasury';
import { getSupplierDebts, paySupplierDebt } from '../../services/apiFinance/apiDebts';
import { getPayableExpenses, payExpense } from '../../services/apiFinance/apiExpense';
import { getSubsidiaries } from '../../services/apiCommon/apiSubsidiaries';
import { getPayrollPaymentSummary } from '../../services/apihr/apiPayroll';
import { getVatDetail } from '../../services/apiFinance/apiTaxTransparency';

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
const EXPENSE_PAYMENT = 'EXPENSE_RECORD_PAYMENT';
type SafeOperation = TreasuryTransactionType | typeof EXPENSE_PAYMENT;

// Décaissement depuis le Coffre-fort — réservé au SUPER_ADMIN (voir
// Disbursement.tsx), calqué sur Frontend_GMO/components/analytics/SafeDisbursementModal.tsx :
// le formulaire change selon le type d'opération sélectionné (bénéficiaire,
// période fiscale, compte destination...).
const SafeDisbursementModal: React.FC<SafeDisbursementModalProps> = ({ isOpen, onClose }) => {
  const { t, formatCurrency } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sourceAccountId, setSourceAccountId] = useState('');
  const [treasuryType, setTreasuryType] = useState<SafeOperation>(TreasuryTransactionType.SUPPLIER_PAYMENT);
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [supplierDebtId, setSupplierDebtId] = useState('');
  const [expenseId, setExpenseId] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [taxSubsidiaryId, setTaxSubsidiaryId] = useState('');
  const [taxMonth, setTaxMonth] = useState(new Date().getMonth() + 1);
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [salaryPaymentMethod, setSalaryPaymentMethod] = useState<'CASH' | 'CHECK' | 'BANK_TRANSFER'>('CASH');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');

  const isExpensePayment = treasuryType === EXPENSE_PAYMENT;
  const isTransfer = !isExpensePayment && TRANSFER_TYPES.includes(treasuryType);
  const isTaxPeriodType = !isExpensePayment && TAX_PERIOD_TYPES.includes(treasuryType);
  const isSupplierPayment = treasuryType === TreasuryTransactionType.SUPPLIER_PAYMENT;

  const resetForm = () => {
    setSourceAccountId('');
    setTreasuryType(TreasuryTransactionType.SUPPLIER_PAYMENT);
    setDestinationAccountId('');
    setSupplierDebtId('');
    setExpenseId('');
    setExpenseSearch('');
    setTaxSubsidiaryId('');
    setTaxMonth(new Date().getMonth() + 1);
    setTaxYear(new Date().getFullYear());
    setSalaryPaymentMethod('CASH');
    setAmount('');
    setDescription('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setReference('');
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  // Le SUPER_ADMIN a une vue globale pour choisir un compte source ou
  // destination situé dans n'importe quelle filiale.
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

  const { data: supplierDebts = [] } = useQuery<SupplierDebt[]>({
    queryKey: ['supplierDebts'],
    queryFn: getSupplierDebts,
    enabled: isOpen && isSupplierPayment,
  });
  const expenses = useQuery({
    queryKey: ['payableExpenses', expenseSearch.trim()],
    queryFn: () => getPayableExpenses(expenseSearch.trim()),
    enabled: isOpen && isExpensePayment,
  });
  const selectedExpense = expenses.data?.find((expense) => expense.id === expenseId);

  const { data: taxCounterparties = [] } = useQuery({
    queryKey: ['counterparties', CounterpartyType.TAX_AUTHORITY],
    queryFn: () => getCounterparties(CounterpartyType.TAX_AUTHORITY),
    enabled: isOpen && isTaxPeriodType,
  });

  const safes = useMemo(() => accounts.filter((a) => a.accountType === AccountType.SAFE), [accounts]);
  const bankAccounts = useMemo(() => accounts.filter((a) => a.accountType === AccountType.BANQUE), [accounts]);
  const selectedSource = safes.find((a) => a.id === sourceAccountId);
  const expenseBoxes = accounts.filter((account) =>
    account.accountType === AccountType.EXPENSE_BOX &&
    (!selectedSource || account.currency === selectedSource.currency)
  );
  const payableDebts = supplierDebts.filter((debt) => debt.status !== 'PAYER' && (!selectedSource || debt.subsidiaryId === selectedSource.subsidiaryId));
  const selectedDebt = payableDebts.find((debt) => debt.id === supplierDebtId);

  const taxPeriodParams = { month: taxMonth, year: taxYear, subsidiaryId: taxSubsidiaryId || undefined };
  const payrollMonth = `${taxYear}-${String(taxMonth).padStart(2, '0')}`;
  const { data: payrollSummary, isLoading: isLoadingPayroll } = useQuery({
    queryKey: ['payrollPaymentSummary', payrollMonth, taxSubsidiaryId],
    queryFn: () => getPayrollPaymentSummary(payrollMonth, taxSubsidiaryId || undefined),
    enabled: isOpen && ((isTaxPeriodType && treasuryType !== TreasuryTransactionType.TVA_PAYMENT) || treasuryType === TreasuryTransactionType.SALARY_PAYMENT),
  });
  const { data: vatDetail } = useQuery({
    queryKey: ['vatDetail', taxPeriodParams],
    queryFn: () => getVatDetail(taxPeriodParams),
    enabled: isOpen && treasuryType === TreasuryTransactionType.TVA_PAYMENT,
  });

  // Montant + description auto-calculés (lecture seule) pour les versements
  // fiscaux/sociaux — même principe que gmo.
  useEffect(() => {
    if (treasuryType === TreasuryTransactionType.SALARY_PAYMENT && payrollSummary) {
      const salary = payrollSummary.byPaymentMethod[salaryPaymentMethod];
      setAmount(salary ? String(salary.netSalary) : '');
      setDescription(salary ? t('safeDisbursement.descriptions.salary', { method: t(`hr.paymentMethod.${salaryPaymentMethod}`), period: payrollMonth }) : '');
    } else if (treasuryType === TreasuryTransactionType.SALARY_PAYMENT) {
      setAmount('');
      setDescription('');
    } else if (treasuryType === TreasuryTransactionType.IRPP_PAYMENT && payrollSummary) {
      setAmount(String(payrollSummary.contributions.irpp));
      setDescription(t('safeDisbursement.descriptions.irpp', { month: taxMonth, year: taxYear }));
    } else if (treasuryType === TreasuryTransactionType.CNPS_PAYMENT && payrollSummary) {
      setAmount(String(payrollSummary.contributions.cnps));
      setDescription(t('safeDisbursement.descriptions.cnps', { month: taxMonth, year: taxYear }));
    } else if (treasuryType === TreasuryTransactionType.CFC_FNE_PAYMENT && payrollSummary) {
      setAmount(String(payrollSummary.contributions.cfcFne));
      setDescription(t('safeDisbursement.descriptions.cfcFne', { month: taxMonth, year: taxYear }));
    } else if (treasuryType === TreasuryTransactionType.TVA_PAYMENT && vatDetail) {
      setAmount(String(vatDetail.details.reduce((sum, detail) => sum + detail.vatAmount, 0)));
      setDescription(t('safeDisbursement.descriptions.tva', { month: taxMonth, year: taxYear }));
    } else if (isTaxPeriodType) {
      setAmount('');
      setDescription('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treasuryType, payrollSummary, vatDetail, taxMonth, taxYear, isTaxPeriodType, salaryPaymentMethod, payrollMonth]);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: async () => {
      if (treasuryType === EXPENSE_PAYMENT) {
        if (!selectedExpense) throw new Error(t('safeDisbursement.selectExpense'));
        await payExpense(selectedExpense.id, {
          safeId: sourceAccountId,
          expectedAmount: Number(selectedExpense.amount),
          transactionDate,
          reference: reference.trim() || undefined,
        });
        return;
      }
      if (isSupplierPayment && selectedDebt) {
        await paySupplierDebt(selectedDebt.id, { paymentDate: transactionDate, treasuryAccountId: sourceAccountId, amount: parseFloat(amount) || 0 });
        return;
      }
      await createDisbursement({
        transactionDate,
        description,
        amount: parseFloat(amount) || 0,
        sourceAccountId,
        destinationAccountId: isTransfer ? destinationAccountId : undefined,
        treasuryType,
        reference: reference || undefined,
        counterpartyId: isTaxPeriodType ? taxCounterparties[0]?.id : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasuryAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['financialTransactions'] });
      if (isExpensePayment) {
        queryClient.invalidateQueries({ queryKey: ['expenseRecords'] });
        queryClient.invalidateQueries({ queryKey: ['payableExpenses'] });
        queryClient.invalidateQueries({ queryKey: ['accountTransactions', sourceAccountId] });
        queryClient.invalidateQueries({ queryKey: ['treasuryStatement', sourceAccountId] });
      }
      if (isTransfer) {
        queryClient.invalidateQueries({ queryKey: ['accountTransactions', sourceAccountId] });
        queryClient.invalidateQueries({ queryKey: ['accountTransactions', destinationAccountId] });
      }
      queryClient.invalidateQueries({ queryKey: ['supplierDebts'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      const destinationType = accounts.find(
        (account) => account.id === destinationAccountId,
      )?.accountType;
      toast(
        'success',
        isTransfer && destinationType === AccountType.BANQUE
          ? t('safeDisbursement.bankPending')
          : t('safeDisbursement.success'),
      );
      onClose();
    },
    onError: (error: any) => {
      if (isExpensePayment && error?.response?.status === 409) {
        setExpenseId('');
        void expenses.refetch();
      }
      toast('error', error?.response?.data?.message || t('common.error'));
    },
  });

  const isCfaCurrency = (currency?: string) => currency === 'XAF' || currency === 'XOF';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpensePayment) {
      if (isCfaCurrency(selectedSource?.currency) && selectedExpense && Number(selectedExpense.amount) <= selectedSource!.balance) submit();
      return;
    }
    if (!sourceAccountId || !amount || parseFloat(amount) <= 0 || !description) return;
    if (isSupplierPayment && (!selectedDebt || parseFloat(amount) > Number(selectedDebt.amount))) return;
    if (isTransfer && !destinationAccountId) return;
    submit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 modal-backdrop z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b bg-gradient-to-r from-[#c6e911]/15 to-white">
          <h3 className="text-lg font-bold text-slate-800">{t('safeDisbursement.title')}</h3>
          <p className="text-sm text-slate-600 mt-1">{t('safeDisbursement.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.sourceSafe')} <span className="text-red-600 ml-1" aria-hidden="true">*</span></label>
            <select
              value={sourceAccountId}
              onChange={(e) => {
                setSourceAccountId(e.target.value);
                if (treasuryType === TreasuryTransactionType.CASH_REFILL) setDestinationAccountId('');
              }}
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
            <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.operationType')} <span className="text-red-600 ml-1" aria-hidden="true">*</span></label>
            <select
              value={treasuryType}
              onChange={(e) => {
                setTreasuryType(e.target.value as SafeOperation);
                setDestinationAccountId('');
                setExpenseId('');
                setExpenseSearch('');
                setAmount('');
                setDescription('');
              }}
              required
              className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border bg-white"
            >
              <option value={TreasuryTransactionType.SUPPLIER_PAYMENT}>{t('safeDisbursement.types.SUPPLIER_PAYMENT')}</option>
              <option value={EXPENSE_PAYMENT}>{t('safeDisbursement.expensePayment')}</option>
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
              <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.destinationBank')} <span className="text-red-600 ml-1" aria-hidden="true">*</span></label>
              <select value={destinationAccountId} onChange={(e) => setDestinationAccountId(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border bg-white">
                <option value="">{t('safeDisbursement.selectBank')}</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.accountName} ({formatCurrency(acc.balance)})</option>
                ))}
              </select>
            </div>
          )}

          {isExpensePayment && (
            <div className="space-y-2">
              <label htmlFor="safe-expense-search" className="block text-sm font-medium text-slate-700">{t('safeDisbursement.expenseSearch')}</label>
              <input id="safe-expense-search" type="search" value={expenseSearch} onChange={(event) => { setExpenseSearch(event.target.value); setExpenseId(''); }} className="w-full rounded-md border border-slate-300 px-3 py-2" />
              <label htmlFor="safe-expense" className="block text-sm font-medium text-slate-700">{t('safeDisbursement.expensePayment')}</label>
              <select id="safe-expense" value={expenseId} onChange={(event) => setExpenseId(event.target.value)} required className="w-full rounded-md border border-slate-300 bg-white px-3 py-2">
                <option value="">{t(expenses.isError ? 'common.error' : expenses.isLoading ? 'common.loading' : expenses.data?.length ? 'safeDisbursement.selectExpense' : 'safeDisbursement.noExpenses')}</option>
                {expenses.data?.map((expense) => (
                  <option key={expense.id} value={expense.id}>{expense.description} · {expense.subsidiary.subsidiaryName} · {expense.expenseDate.slice(0, 10)} · {formatCurrency(Number(expense.amount))}</option>
                ))}
              </select>
              {selectedSource && !isCfaCurrency(selectedSource.currency) && <p role="alert" className="text-sm text-rose-700">{t('safeDisbursement.expenseCurrency')}</p>}
              {selectedSource && selectedExpense && Number(selectedExpense.amount) > selectedSource.balance && <p role="alert" className="text-sm text-rose-700">{t('safeDisbursement.insufficientBalance', { balance: formatCurrency(selectedSource.balance) })}</p>}
            </div>
          )}

          {treasuryType === TreasuryTransactionType.CASH_REFILL && (
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.destinationExpenseBox')} <span className="text-red-600 ml-1" aria-hidden="true">*</span></label>
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
              <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.supplierDebt')}</label>
              <select value={supplierDebtId} onChange={(e) => { const id = e.target.value; setSupplierDebtId(id); const debt = payableDebts.find((item) => item.id === id); if (debt) setAmount(String(debt.amount)); }} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border bg-white">
                <option value="">{payableDebts.length ? t('safeDisbursement.selectSupplierDebt') : t('safeDisbursement.noSupplierDebt')}</option>
                {payableDebts.map((debt) => (
                  <option key={debt.id} value={debt.id}>{debt.supplierName} — {debt.invoiceId} — {formatCurrency(Number(debt.amount))}</option>
                ))}
              </select>
            </div>
          )}

          {(isTaxPeriodType || treasuryType === TreasuryTransactionType.SALARY_PAYMENT) && (
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

          {treasuryType === TreasuryTransactionType.SALARY_PAYMENT && (
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('configuration.form.paymentMethod')}</label>
              <select value={salaryPaymentMethod} onChange={(event) => setSalaryPaymentMethod(event.target.value as typeof salaryPaymentMethod)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
                {(['CASH', 'CHECK', 'BANK_TRANSFER'] as const).map((method) => <option key={method} value={method}>{t(`hr.paymentMethod.${method}`)}</option>)}
              </select>
              {payrollSummary && !payrollSummary.byPaymentMethod[salaryPaymentMethod] && <p className="mt-1 text-xs text-amber-700">{t('safeDisbursement.noPayroll')}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.amount')} <span className="text-red-600 ml-1" aria-hidden="true">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={isExpensePayment ? selectedExpense?.amount ?? '' : amount}
                onChange={(e) => setAmount(e.target.value)}
                readOnly={isTaxPeriodType || isExpensePayment || treasuryType === TreasuryTransactionType.SALARY_PAYMENT}
                required
                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border read-only:bg-slate-100"
              />
              {isLoadingPayroll && <p className="mt-1 text-xs text-slate-500">{t('safeDisbursement.loadingPayroll')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.date')} <span className="text-red-600 ml-1" aria-hidden="true">*</span></label>
              <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border" />
            </div>
          </div>

          {!isExpensePayment && <div>
            <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.description')} <span className="text-red-600 ml-1" aria-hidden="true">*</span></label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              readOnly={isTaxPeriodType || treasuryType === TreasuryTransactionType.SALARY_PAYMENT}
              required
              className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border read-only:bg-slate-100"
            />
          </div>}

          <div>
            <label className="block text-sm font-medium text-slate-700">{t('safeDisbursement.reference')}</label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isPending || (isLoadingPayroll && (isTaxPeriodType || treasuryType === TreasuryTransactionType.SALARY_PAYMENT)) || (isSupplierPayment && !selectedDebt) || (isExpensePayment && (!selectedExpense || !isCfaCurrency(selectedSource?.currency) || Number(selectedExpense.amount) > selectedSource!.balance))} className="px-4 py-2 bg-[#231F20] text-white rounded-md hover:bg-slate-700 transition-colors disabled:opacity-50">
              {isPending ? t('safeDisbursement.submitting') : t('safeDisbursement.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SafeDisbursementModal;
