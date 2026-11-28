import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Subsidiary } from '../../types';
import { useI18n } from '../../i18n';
import { getCashflowReport, getProfitabilityReport } from '../../services/apiStatistic/apiFinanceStats';

interface CashflowProfitabilityViewProps {
  subsidiary: Subsidiary | null;
}

const CashflowProfitabilityView: React.FC<CashflowProfitabilityViewProps> = ({ subsidiary }) => {
  const { t, formatCurrency } = useI18n();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const period = {
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  };

  const { data: cashflow, isLoading: loadingCashflow } = useQuery({
    queryKey: ['financePilotage', 'cashflow', subsidiary?.id ?? 'ALL', startDate, endDate],
    queryFn: () => getCashflowReport(period, subsidiary?.id),
  });

  const { data: profitability, isLoading: loadingProfitability } = useQuery({
    queryKey: ['financePilotage', 'profitability', subsidiary?.id ?? 'ALL', startDate, endDate],
    queryFn: () => getProfitabilityReport(period, subsidiary?.id),
  });

  const isLoading = loadingCashflow || loadingProfitability;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {t('finance.pilotage.title')}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('finance.pilotage.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-slate-600 flex items-center gap-1.5">
            {t('common.from')}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs"
            />
          </label>
          <label className="text-xs text-slate-600 flex items-center gap-1.5">
            {t('common.to')}
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs"
            />
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500">
                {t('finance.pilotage.cashPosition')}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
                {formatCurrency(cashflow?.totalCashPosition ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500">
                {t('finance.pilotage.netCashflow')}
              </p>
              <p
                className={`mt-2 text-2xl font-bold tabular-nums ${
                  (cashflow?.period.netCashflow ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {formatCurrency(cashflow?.period.netCashflow ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500">
                {t('finance.pilotage.operatingResult')}
              </p>
              <p
                className={`mt-2 text-2xl font-bold tabular-nums ${
                  (profitability?.netOperatingResult ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {formatCurrency(profitability?.netOperatingResult ?? 0)}
              </p>
              <p className="mt-1 text-xs text-slate-500 tabular-nums">
                {t('finance.pilotage.marginRate')}: {profitability?.marginRate ?? 0}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500">
                {t('finance.pilotage.collectionRate')}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
                {profitability?.collectionRate ?? 0}%
              </p>
              <p className="mt-1 text-xs text-slate-500 tabular-nums">
                {formatCurrency(profitability?.collectedRevenue ?? 0)} /{' '}
                {formatCurrency(profitability?.invoicedRevenue ?? 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">
                {t('finance.pilotage.cashBreakdown')}
              </h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600">{t('treasuryAccounts.types.CASH_REGISTER')}</dt>
                  <dd className="font-semibold tabular-nums">{formatCurrency(cashflow?.balancesByType.cashRegister ?? 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">{t('treasuryAccounts.types.SAFE')}</dt>
                  <dd className="font-semibold tabular-nums">{formatCurrency(cashflow?.balancesByType.safe ?? 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">{t('treasuryAccounts.types.BANQUE')}</dt>
                  <dd className="font-semibold tabular-nums">{formatCurrency(cashflow?.balancesByType.bank ?? 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">{t('treasuryAccounts.types.EXPENSE_BOX')}</dt>
                  <dd className="font-semibold tabular-nums">{formatCurrency(cashflow?.balancesByType.expenseBox ?? 0)}</dd>
                </div>
                <div className="flex justify-between border-t border-[var(--border)] pt-2">
                  <dt className="text-slate-600">{t('finance.pilotage.pendingReceivables')}</dt>
                  <dd className="font-semibold tabular-nums text-amber-700">{formatCurrency(cashflow?.pending.customerReceivables ?? 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">{t('finance.pilotage.pendingDebts')}</dt>
                  <dd className="font-semibold tabular-nums text-rose-700">{formatCurrency(cashflow?.pending.supplierDebts ?? 0)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">
                {t('finance.pilotage.profitabilitySummary')}
              </h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600">{t('finance.pilotage.invoicedRevenue')}</dt>
                  <dd className="font-semibold tabular-nums">{formatCurrency(profitability?.invoicedRevenue ?? 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">{t('finance.pilotage.purchaseCosts')}</dt>
                  <dd className="font-semibold tabular-nums text-rose-700">-{formatCurrency(profitability?.purchaseCosts ?? 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">{t('finance.pilotage.operatingExpenses')}</dt>
                  <dd className="font-semibold tabular-nums text-rose-700">-{formatCurrency(profitability?.operatingExpenses ?? 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">{t('finance.pilotage.payrollCosts')}</dt>
                  <dd className="font-semibold tabular-nums text-rose-700">-{formatCurrency(profitability?.payrollCosts ?? 0)}</dd>
                </div>
                <div className="flex justify-between border-t border-[var(--border)] pt-2 font-bold">
                  <dt className="text-slate-900">{t('finance.pilotage.grossMargin')}</dt>
                  <dd className="tabular-nums text-slate-900">{formatCurrency(profitability?.grossMargin ?? 0)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CashflowProfitabilityView;
