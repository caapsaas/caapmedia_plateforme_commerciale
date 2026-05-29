import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBalanceGenerale, BalanceGeneraleLine, FiscalPeriod } from '../../services/apiAccounting/apiAccounting';

interface BalanceGeneraleProps {
  fiscalPeriods: FiscalPeriod[];
}

const BalanceGenerale: React.FC<BalanceGeneraleProps> = ({ fiscalPeriods }) => {
  const [fiscalYearId, setFiscalYearId] = useState('');

  const { data: lines = [], isLoading } = useQuery<BalanceGeneraleLine[]>({
    queryKey: ['balance-generale', fiscalYearId],
    queryFn: () => getBalanceGenerale(fiscalYearId || undefined),
    enabled: fiscalPeriods.length > 0,
  });

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n);

  const totals = useMemo(() => ({
    mouvDebit: lines.reduce((s, l) => s + l.mouvDebit, 0),
    mouvCredit: lines.reduce((s, l) => s + l.mouvCredit, 0),
    soldeDebiteur: lines.reduce((s, l) => s + l.soldeDebiteur, 0),
    soldeCrediteur: lines.reduce((s, l) => s + l.soldeCrediteur, 0),
  }), [lines]);

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

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500">Chargement de la balance...</div>
        ) : lines.length === 0 ? (
          <div className="py-12 text-center text-slate-400">Aucune donnée pour cet exercice.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" rowSpan={2}>N° Compte</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" rowSpan={2}>Intitulé</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase" colSpan={2}>Mouvements</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase" colSpan={2}>Soldes</th>
                </tr>
                <tr className="bg-slate-700 text-white">
                  <th className="px-4 py-2 text-right text-xs font-semibold">Débit</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold">Crédit</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold">Débiteur</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold">Créditeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((line) => (
                  <tr key={line.accountNumber} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-sm font-mono font-semibold text-slate-800">{line.accountNumber}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-700">{line.label}</td>
                    <td className="px-4 py-2.5 text-sm text-right text-blue-700">{fmt(line.mouvDebit)}</td>
                    <td className="px-4 py-2.5 text-sm text-right text-red-700">{fmt(line.mouvCredit)}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium text-slate-800">
                      {line.soldeDebiteur > 0 ? fmt(line.soldeDebiteur) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium text-slate-800">
                      {line.soldeCrediteur > 0 ? fmt(line.soldeCrediteur) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800 text-white">
                  <td colSpan={2} className="px-4 py-3 text-sm font-bold uppercase">Totaux généraux</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">{fmt(totals.mouvDebit)}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">{fmt(totals.mouvCredit)}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">{fmt(totals.soldeDebiteur)}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">{fmt(totals.soldeCrediteur)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {!isLoading && lines.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          Balance à {lines.length} compte(s) — SYSCOHADA révisé 2017
        </p>
      )}
    </div>
  );
};

export default BalanceGenerale;
