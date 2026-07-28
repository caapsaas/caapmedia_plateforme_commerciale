import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, DollarSign, Banknote, ArrowUpRight, ArrowDownRight,
  Unlock, Lock, CheckCircle2, FilePen,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { getEntries, JournalEntry } from '../../services/apiAccounting/apiEntries';
import { getSyscohadaStatements } from '../../services/apiAccounting/apiReports';
import { FiscalYear } from '../../services/apiAccounting/apiPeriods';
import SubsidiaryFilter from '../filters/SubsidiaryFilter';

interface AccountingDashboardProps {
  fiscalPeriods: FiscalYear[];
}

const JOURNAL_CONFIG: Record<string, { label: string; color: string }> = {
  JV: { label: 'Ventes', color: '#f97316' },
  JA: { label: 'Achats', color: '#3b82f6' },
  JB: { label: 'Banque', color: '#a855f7' },
  JC: { label: 'Caisse', color: '#ef4444' },
  JOD: { label: 'Opérations diverses', color: '#22c55e' },
};

const fmtFCFA = (v: number) => `${new Intl.NumberFormat('fr-FR').format(Math.round(v))} FCFA`;

const KpiCardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="h-3 bg-slate-200 rounded w-24" />
      <div className="h-5 w-5 bg-slate-200 rounded" />
    </div>
    <div className="h-6 bg-slate-200 rounded w-32 mb-2" />
    <div className="h-3 bg-slate-200 rounded w-20" />
  </div>
);

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
      <div className="text-slate-400">{icon}</div>
    </div>
    <p className="text-2xl font-semibold text-slate-900">{value}</p>
    <p className="text-xs text-slate-400 mt-1">Données à jour</p>
  </div>
);

const AccountingDashboard: React.FC<AccountingDashboardProps> = ({ fiscalPeriods }) => {
  const [subsidiaryId, setSubsidiaryId] = useState('');
  const currentFiscalYear = useMemo(
    () => fiscalPeriods.find((p) => !p.isClosed) ?? fiscalPeriods[0],
    [fiscalPeriods],
  );

  const { data: entries = [] } = useQuery<JournalEntry[]>({
    queryKey: ['accounting-entries', 'dashboard'],
    queryFn: () => getEntries(),
  });

  const { data: statements, isLoading: isLoadingStatements } = useQuery({
    queryKey: ['syscohada-statements', 'dashboard', currentFiscalYear?.id, subsidiaryId],
    queryFn: () => getSyscohadaStatements(currentFiscalYear!.id, subsidiaryId || undefined),
    enabled: !!currentFiscalYear,
  });

  const draftCount = entries.filter((e) => e.status === 'DRAFT').length;
  const postedCount = entries.filter((e) => e.status === 'POSTED').length;
  const totalCount = entries.length;

  const recentEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()).slice(0, 6),
    [entries],
  );

  const monthlyData = useMemo(() => {
    const byMonth = new Map<string, number>();
    entries.filter((e) => e.status === 'POSTED').forEach((e) => {
      const d = new Date(e.entryDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const amount = e.lines.reduce((s, l) => s + Number(l.debitAmount || 0), 0);
      byMonth.set(key, (byMonth.get(key) || 0) + amount);
    });
    return [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, montant]) => {
        const [, month] = key.split('-');
        const label = new Date(2000, Number(month) - 1, 1).toLocaleDateString('fr-FR', { month: 'short' });
        return { name: label, montant };
      });
  }, [entries]);

  const journalDistribution = useMemo(() => {
    const byJournal = new Map<string, { code: string; total: number; debit: number; credit: number }>();
    entries.filter((e) => e.status === 'POSTED').forEach((e) => {
      const code = e.journal?.code || '—';
      const debit = e.lines.reduce((s, l) => s + Number(l.debitAmount || 0), 0);
      const credit = e.lines.reduce((s, l) => s + Number(l.creditAmount || 0), 0);
      const existing = byJournal.get(code) || { code, total: 0, debit: 0, credit: 0 };
      existing.debit += debit;
      existing.credit += credit;
      existing.total += debit;
      byJournal.set(code, existing);
    });
    return [...byJournal.values()].filter((j) => j.total > 0);
  }, [entries]);

  const expenseRatio = statements && statements.comptResultat.totalProduits > 0
    ? Math.min(100, (statements.comptResultat.totalCharges / statements.comptResultat.totalProduits) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {!currentFiscalYear && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          Aucun exercice fiscal — créez-en un dans l'onglet Paramètres pour voir les indicateurs financiers.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SubsidiaryFilter value={subsidiaryId} onChange={setSubsidiaryId} />
        {currentFiscalYear && (
          <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${currentFiscalYear.isClosed ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {currentFiscalYear.isClosed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {currentFiscalYear.name} {currentFiscalYear.isClosed ? '(clôturé)' : '(ouvert)'}
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoadingStatements ? (
          Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : statements ? (
          <>
            <KpiCard title="Produits" value={fmtFCFA(statements.comptResultat.totalProduits)} icon={<TrendingUp className="w-5 h-5" />} />
            <KpiCard title="Charges" value={fmtFCFA(statements.comptResultat.totalCharges)} icon={<TrendingDown className="w-5 h-5" />} />
            <KpiCard title="Résultat net" value={fmtFCFA(statements.comptResultat.resultatNet)} icon={<DollarSign className="w-5 h-5" />} />
            <KpiCard title="Trésorerie" value={fmtFCFA(statements.bilan.actif.tresorerie)} icon={<Banknote className="w-5 h-5" />} />
            <KpiCard title="Créances clients" value={fmtFCFA(statements.bilan.actif.creancesClients)} icon={<ArrowUpRight className="w-5 h-5" />} />
            <KpiCard title="Dettes fournisseurs" value={fmtFCFA(statements.bilan.passif.dettesFournisseurs)} icon={<ArrowDownRight className="w-5 h-5" />} />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Écritures validées par mois</h3>
          {monthlyData.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">Aucune écriture validée récente.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v)} />
                <Tooltip formatter={(v: number) => fmtFCFA(v)} />
                <Bar dataKey="montant" fill="#c6e911" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Statistiques rapides</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Validées</span>
            <span className="font-semibold text-slate-800">{postedCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600"><FilePen className="w-4 h-4 text-amber-500" /> Brouillons</span>
            <span className="font-semibold text-slate-800">{draftCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600"><DollarSign className="w-4 h-4 text-blue-500" /> Total écritures</span>
            <span className="font-semibold text-slate-800">{totalCount}</span>
          </div>
          {statements && (
            <div className="pt-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Charges / Produits</span>
                <span>{expenseRatio.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-[#c6e911] h-1.5 rounded-full transition-all" style={{ width: `${expenseRatio}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent entries */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Écritures récentes</h3>
          {recentEntries.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">Aucune écriture.</div>
          ) : (
            <div className="space-y-2">
              {recentEntries.map((entry) => {
                const amount = entry.lines.reduce((s, l) => s + Number(l.debitAmount || 0), 0);
                return (
                  <div key={entry.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800 truncate">{entry.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">{entry.journal?.code ?? '—'}</span>
                        <span className="text-xs text-slate-400">{new Date(entry.entryDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold text-slate-700">{fmtFCFA(amount)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${entry.status === 'POSTED' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        {entry.status === 'POSTED' ? 'Validé' : 'Brouillon'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Journal distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Répartition par journal</h3>
          {journalDistribution.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">Aucune écriture validée.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={journalDistribution} dataKey="total" nameKey="code" innerRadius={45} outerRadius={70} paddingAngle={2}>
                    {journalDistribution.map((j) => (
                      <Cell key={j.code} fill={JOURNAL_CONFIG[j.code]?.color ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, _n, entry: any) => [fmtFCFA(v), `Débit ${fmtFCFA(entry.payload.debit)} / Crédit ${fmtFCFA(entry.payload.credit)}`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {journalDistribution.map((j) => (
                  <div key={j.code} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: JOURNAL_CONFIG[j.code]?.color ?? '#94a3b8' }} />
                    <span className="text-slate-600 truncate">{JOURNAL_CONFIG[j.code]?.label ?? j.code}</span>
                    <span className="ml-auto font-semibold text-slate-700">{fmtFCFA(j.total)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountingDashboard;
