import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, Banknote, CalendarDays, Clock3, RefreshCw, WalletCards } from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import Pagination from '../components/common/Pagination';
import { useClientPagination } from '../hooks/useClientPagination';

type DailyReceipt = { id: string; transactionDate: string; description?: string | null; amount: number | string; status: string; treasuryAccount: { accountName: string; accountType: string } };
type ReceiptResponse = { date: string; total: number; count: number; transactions: DailyReceipt[] };

const CashierReceipts: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const isSuperAdmin = user?.activeRole === UserRole.SUPER_ADMIN || user?.userRole === UserRole.SUPER_ADMIN;
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['cashier-daily-receipts'],
    queryFn: async () => (await api.get<ReceiptResponse>('/ecommerce/orders/cashier/daily-receipts')).data,
    refetchInterval: 30_000,
  });
  const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0, signDisplay: 'always' });
  const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const receipts = data?.transactions ?? [];
  const { pageItems: pageReceipts, meta: receiptsMeta, setPage } = useClientPagination(receipts);
  const hourly = Array.from({ length: 8 }, (_, index) => {
    const hour = index * 3;
    const total = receipts.filter(receipt => new Date(receipt.transactionDate).getHours() >= hour && new Date(receipt.transactionDate).getHours() < hour + 3)
      .reduce((sum, receipt) => sum + Number(receipt.amount), 0);
    return { label: `${String(hour).padStart(2, '0')}h`, total };
  });
  const maxHour = Math.max(...hourly.map(item => item.total), 1);

  return <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c6e911]/25 text-slate-900"><Banknote size={23} /></span>
          <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">{t(isSuperAdmin ? 'cashierReceipts.adminTitle' : 'cashierReceipts.title')}</h1><p className="mt-1 flex items-center gap-1.5 text-sm capitalize text-slate-500"><CalendarDays size={14} />{today}<span className="mx-1 text-slate-300">·</span>{t(isSuperAdmin ? 'cashierReceipts.adminSubtitle' : 'cashierReceipts.subtitle')}</p></div>
        </div>
        <button type="button" onClick={() => void refetch()} disabled={isFetching} aria-label={t('cashierReceipts.refresh')} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#a8d814] hover:bg-lime-50 disabled:opacity-60"><RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />{t('cashierReceipts.refresh')}</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-slate-200/80 border-l-4 border-l-[#c6e911] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{t('cashierReceipts.total')}</p><span className="rounded-lg bg-[#c6e911]/20 p-2.5 text-slate-800"><Banknote size={20} /></span></div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-700">{isLoading ? '—' : money.format(data?.total ?? 0)}</p>
          <p className="mt-1.5 text-xs text-slate-500">{t('cashierReceipts.todayTotal')}</p>
        </article>
        <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{t('cashierReceipts.count')}</p><span className="rounded-lg bg-slate-100 p-2.5 text-slate-700"><WalletCards size={20} /></span></div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{isLoading ? '—' : data?.count ?? 0}</p>
          <p className="mt-1.5 text-xs text-slate-500">{t('cashierReceipts.operationsToday')}</p>
        </article>
      </div>
    </section>

    {isError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{t('cashierReceipts.error')}</div> : <div className="grid gap-6 lg:grid-cols-[0.85fr_1.5fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">{t('cashierReceipts.activity')}</h2><p className="mt-1 text-xs text-slate-500">{t('cashierReceipts.activityHint')}</p></div><span className="rounded-lg bg-[#c6e911]/20 p-2.5 text-slate-800"><ArrowDownLeft size={19} /></span></div>
        <div className="mt-8 flex h-36 items-end gap-2">
          {hourly.map((item, index) => <div key={item.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-2" title={`${item.label}: ${money.format(item.total)}`}>
            <div className="flex w-full flex-1 items-end"><div className={`w-full rounded-t-md bg-[#c6e911] transition-all duration-700 ${item.total ? 'opacity-100 group-hover:bg-[#a8d814]' : 'opacity-25'}`} style={{ height: `${Math.max(item.total ? 12 : 5, item.total / maxHour * 100)}%`, transitionDelay: `${index * 45}ms` }} /></div>
            <span className="text-[10px] font-medium text-slate-400">{item.label}</span>
          </div>)}
        </div>
        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500"><Clock3 size={14} className="text-slate-500" />{t('cashierReceipts.liveUpdate')}</div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6"><div><h2 className="font-semibold text-slate-900">{t('cashierReceipts.details')}</h2><p className="mt-1 text-xs text-slate-500">{t('cashierReceipts.latestFirst')}</p></div><span className="rounded-full bg-[#c6e911]/25 px-3 py-1 text-xs font-semibold text-slate-800">{receipts.length}</span></div>
        {isLoading ? <div className="space-y-3 p-5">{[1, 2, 3].map(item => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div> : !receipts.length ? <div className="px-6 py-14 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Banknote size={22} /></span><p className="mt-4 font-medium text-slate-700">{t('cashierReceipts.empty')}</p><p className="mt-1 text-sm text-slate-500">{t('cashierReceipts.emptyHint')}</p></div> : <div className="divide-y divide-slate-100">
          {pageReceipts.map(receipt => <article key={receipt.id} className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50/80 sm:gap-4 sm:px-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ArrowDownLeft size={19} /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{receipt.description || t('cashierReceipts.receipt')}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Clock3 size={12} />{new Date(receipt.transactionDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}<span className="text-slate-300">·</span>{receipt.treasuryAccount.accountName}</p></div>
            <div className="shrink-0 text-right"><p className="text-sm font-bold text-emerald-700">{money.format(Number(receipt.amount))}</p><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${receipt.status === 'VALIDE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{receipt.status}</span></div>
          </article>)}
        </div>}
        <Pagination meta={receiptsMeta} onPageChange={setPage} />
      </section>
    </div>}
  </main>;
};

export default CashierReceipts;
