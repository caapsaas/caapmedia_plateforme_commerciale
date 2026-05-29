import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJournalCentralisateur, JournalCentralisateurEntry, FiscalPeriod } from '../../services/apiAccounting/apiAccounting';

interface JournalCentralisateurProps {
  fiscalPeriods: FiscalPeriod[];
}

const JournalCentralisateur: React.FC<JournalCentralisateurProps> = ({ fiscalPeriods }) => {
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [expandedJournal, setExpandedJournal] = useState<string | null>(null);

  const { data: journals = [], isLoading } = useQuery<JournalCentralisateurEntry[]>({
    queryKey: ['journal-centralisateur', fiscalYearId],
    queryFn: () => getJournalCentralisateur(fiscalYearId || undefined),
    enabled: fiscalPeriods.length > 0,
  });

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR');

  const grandTotalDebit = journals.reduce((s, j) => s + j.totalDebit, 0);
  const grandTotalCredit = journals.reduce((s, j) => s + j.totalCredit, 0);

  const JOURNAL_COLORS: Record<string, string> = {
    JV: 'bg-green-100 text-green-800',
    JA: 'bg-blue-100 text-blue-800',
    JB: 'bg-purple-100 text-purple-800',
    JOD: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium text-slate-700">Exercice :</label>
          <select
            value={fiscalYearId}
            onChange={(e) => setFiscalYearId(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
          >
            <option value="">Tous</option>
            {fiscalPeriods.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-sm bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors"
        >
          Imprimer
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500">Chargement...</div>
      ) : journals.length === 0 ? (
        <div className="py-12 text-center text-slate-400">Aucune donnée pour cet exercice.</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {journals.map((j) => (
              <div key={j.journalCode} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${JOURNAL_COLORS[j.journalCode] ?? 'bg-slate-100 text-slate-700'}`}>
                    {j.journalCode}
                  </span>
                  <span className="text-xs text-slate-500 truncate">{j.journalLabel}</span>
                </div>
                <p className="text-sm text-blue-700 font-medium">{fmt(j.totalDebit)} D</p>
                <p className="text-sm text-red-700 font-medium">{fmt(j.totalCredit)} C</p>
                <p className="text-xs text-slate-400 mt-1">{j.entries.length} écriture(s)</p>
              </div>
            ))}
          </div>

          {/* Detailed journal tables */}
          <div className="space-y-3">
            {journals.map((journal) => {
              const isExpanded = expandedJournal === journal.journalCode;
              return (
                <div key={journal.journalCode} className="bg-white rounded-xl shadow overflow-hidden">
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                    onClick={() => setExpandedJournal(isExpanded ? null : journal.journalCode)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs">{isExpanded ? '▼' : '▶'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${JOURNAL_COLORS[journal.journalCode] ?? 'bg-slate-100 text-slate-700'}`}>
                        {journal.journalCode}
                      </span>
                      <span className="font-semibold text-slate-800">{journal.journalLabel}</span>
                      <span className="text-xs text-slate-400">({journal.entries.length} écriture(s))</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span className="text-blue-700 font-bold">{fmt(journal.totalDebit)}</span>
                      <span className="text-red-700 font-bold">{fmt(journal.totalCredit)}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100">
                      <table className="min-w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-slate-500">N° Écriture</th>
                            <th className="px-4 py-2 text-left text-slate-500">Date</th>
                            <th className="px-4 py-2 text-left text-slate-500">Description</th>
                            <th className="px-4 py-2 text-right text-slate-500">Débit</th>
                            <th className="px-4 py-2 text-right text-slate-500">Crédit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {journal.entries.map((entry, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-2 font-mono text-slate-700">{entry.entryNumber}</td>
                              <td className="px-4 py-2 text-slate-600">{fmtDate(entry.date)}</td>
                              <td className="px-4 py-2 text-slate-600 max-w-xs truncate">{entry.description}</td>
                              <td className="px-4 py-2 text-right text-blue-700">{entry.debit > 0 ? fmt(entry.debit) : '—'}</td>
                              <td className="px-4 py-2 text-right text-red-700">{entry.credit > 0 ? fmt(entry.credit) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100">
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Total {journal.journalCode}</td>
                            <td className="px-4 py-2 text-right text-xs font-bold text-blue-800">{fmt(journal.totalDebit)}</td>
                            <td className="px-4 py-2 text-right text-xs font-bold text-red-800">{fmt(journal.totalCredit)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grand totals */}
          <div className="bg-slate-800 text-white rounded-xl p-4 flex justify-between items-center">
            <span className="font-bold text-sm uppercase">Totaux généraux</span>
            <div className="flex gap-8">
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Débit</p>
                <p className="text-lg font-bold">{fmt(grandTotalDebit)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Crédit</p>
                <p className="text-lg font-bold">{fmt(grandTotalCredit)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default JournalCentralisateur;
