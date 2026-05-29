import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGrandLivre, GrandLivreAccount, FiscalPeriod } from '../../services/apiAccounting/apiAccounting';

interface GrandLivreProps {
  fiscalPeriods: FiscalPeriod[];
}

const GrandLivre: React.FC<GrandLivreProps> = ({ fiscalPeriods }) => {
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);

  const { data: accounts = [], isLoading, refetch } = useQuery<GrandLivreAccount[]>({
    queryKey: ['grand-livre', fiscalYearId],
    queryFn: () => getGrandLivre(fiscalYearId || undefined),
    enabled: fiscalPeriods.length > 0,
  });

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR');

  const totalDebit = accounts.reduce((s, a) => s + a.totalDebit, 0);
  const totalCredit = accounts.reduce((s, a) => s + a.totalCredit, 0);

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
        <div className="py-12 text-center text-slate-500">Chargement du grand livre...</div>
      ) : accounts.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          Aucune écriture comptable pour cet exercice.
        </div>
      ) : (
        <>
          {/* Summary totals */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <p className="text-xs text-blue-600 font-medium uppercase">Total Débit</p>
              <p className="text-xl font-bold text-blue-800 mt-1">{fmt(totalDebit)} FCFA</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-xs text-red-600 font-medium uppercase">Total Crédit</p>
              <p className="text-xl font-bold text-red-800 mt-1">{fmt(totalCredit)} FCFA</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <p className="text-xs text-emerald-600 font-medium uppercase">Comptes mouvementés</p>
              <p className="text-xl font-bold text-emerald-800 mt-1">{accounts.length}</p>
            </div>
          </div>

          {/* Accounts */}
          <div className="space-y-2">
            {accounts.map((account) => {
              const isExpanded = expandedAccount === account.accountNumber;
              return (
                <div key={account.accountNumber} className="bg-white rounded-xl shadow overflow-hidden">
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                    onClick={() => setExpandedAccount(isExpanded ? null : account.accountNumber)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs">{isExpanded ? '▼' : '▶'}</span>
                      <span className="font-mono font-semibold text-slate-800">{account.accountNumber}</span>
                      <span className="text-slate-600 text-sm">{account.label}</span>
                      <span className="text-xs text-slate-400">({account.entries.length} mvt.)</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span className="text-blue-700 font-medium">{fmt(account.totalDebit)}</span>
                      <span className="text-red-700 font-medium">{fmt(account.totalCredit)}</span>
                      <span className={`font-bold ${account.finalBalance >= 0 ? 'text-slate-800' : 'text-red-700'}`}>
                        {account.finalBalance >= 0 ? `SD ${fmt(account.finalBalance)}` : `SC ${fmt(Math.abs(account.finalBalance))}`}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100">
                      <table className="min-w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-slate-500">Date</th>
                            <th className="px-4 py-2 text-left text-slate-500">N° Écriture</th>
                            <th className="px-4 py-2 text-left text-slate-500">Description</th>
                            <th className="px-4 py-2 text-right text-slate-500">Débit</th>
                            <th className="px-4 py-2 text-right text-slate-500">Crédit</th>
                            <th className="px-4 py-2 text-right text-slate-500">Solde cumulé</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {account.entries.map((entry, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-2 text-slate-600">{fmtDate(entry.date)}</td>
                              <td className="px-4 py-2 font-mono text-slate-700">{entry.entryNumber}</td>
                              <td className="px-4 py-2 text-slate-600 max-w-xs truncate">{entry.description}</td>
                              <td className="px-4 py-2 text-right text-blue-700">{entry.debit > 0 ? fmt(entry.debit) : '—'}</td>
                              <td className="px-4 py-2 text-right text-red-700">{entry.credit > 0 ? fmt(entry.credit) : '—'}</td>
                              <td className={`px-4 py-2 text-right font-medium ${entry.balance >= 0 ? 'text-slate-800' : 'text-red-700'}`}>
                                {fmt(Math.abs(entry.balance))} {entry.balance >= 0 ? 'D' : 'C'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100">
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Totaux</td>
                            <td className="px-4 py-2 text-right text-xs font-bold text-blue-800">{fmt(account.totalDebit)}</td>
                            <td className="px-4 py-2 text-right text-xs font-bold text-red-800">{fmt(account.totalCredit)}</td>
                            <td className="px-4 py-2 text-right text-xs font-bold text-slate-800">
                              {account.finalBalance >= 0
                                ? `SD ${fmt(account.finalBalance)}`
                                : `SC ${fmt(Math.abs(account.finalBalance))}`}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default GrandLivre;
