import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSyscohadaStatements, SyscohadaStatements as StatementsType, FiscalPeriod } from '../../services/apiAccounting/apiAccounting';

interface SyscohadaStatementsProps {
  fiscalPeriods: FiscalPeriod[];
}

const SyscohadaStatements: React.FC<SyscohadaStatementsProps> = ({ fiscalPeriods }) => {
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [activeStatement, setActiveStatement] = useState<'bilan' | 'resultat'>('bilan');

  const { data, isLoading } = useQuery<StatementsType>({
    queryKey: ['syscohada-statements', fiscalYearId],
    queryFn: () => getSyscohadaStatements(fiscalYearId || undefined),
    enabled: fiscalPeriods.length > 0,
  });

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n);

  const isBalanced = data ? Math.abs(data.bilan.totalActif - data.bilan.totalPassif) < 1 : true;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
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
          <div className="flex rounded-lg overflow-hidden border border-slate-200">
            <button
              onClick={() => setActiveStatement('bilan')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeStatement === 'bilan' ? 'bg-[#c6e911] text-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              Bilan
            </button>
            <button
              onClick={() => setActiveStatement('resultat')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeStatement === 'resultat' ? 'bg-[#c6e911] text-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              Compte de résultat
            </button>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-sm bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors"
        >
          Imprimer
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500">Chargement des états financiers...</div>
      ) : !data ? (
        <div className="py-12 text-center text-slate-400">Aucune donnée disponible.</div>
      ) : activeStatement === 'bilan' ? (
        /* ====== BILAN ====== */
        <div>
          {!isBalanced && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              Attention : le bilan n'est pas équilibré. Vérifiez les écritures comptables.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ACTIF */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="bg-blue-700 text-white px-4 py-3">
                <h3 className="font-bold text-sm uppercase tracking-wide">Actif</h3>
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-blue-700 font-semibold">Poste</th>
                    <th className="px-4 py-2 text-right text-xs text-blue-700 font-semibold">Brut</th>
                    <th className="px-4 py-2 text-right text-xs text-blue-700 font-semibold">Amort./Dép.</th>
                    <th className="px-4 py-2 text-right text-xs text-blue-700 font-semibold">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.bilan.actif.map((line, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30">
                      <td className="px-4 py-2.5 text-slate-700">{line.label}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{fmt(line.brut)}</td>
                      <td className="px-4 py-2.5 text-right text-red-600">{line.amortissement > 0 ? fmt(line.amortissement) : '—'}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmt(line.net)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-700 text-white">
                    <td className="px-4 py-3 font-bold text-sm">TOTAL ACTIF</td>
                    <td className="px-4 py-3 text-right font-bold text-sm">—</td>
                    <td className="px-4 py-3 text-right font-bold text-sm">—</td>
                    <td className="px-4 py-3 text-right font-bold text-sm">{fmt(data.bilan.totalActif)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* PASSIF */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="bg-slate-700 text-white px-4 py-3">
                <h3 className="font-bold text-sm uppercase tracking-wide">Passif</h3>
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-slate-500 font-semibold">Poste</th>
                    <th className="px-4 py-2 text-right text-xs text-slate-500 font-semibold">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.bilan.passif.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-700">{line.label}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmt(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-700 text-white">
                    <td className="px-4 py-3 font-bold text-sm">TOTAL PASSIF</td>
                    <td className="px-4 py-3 text-right font-bold text-sm">{fmt(data.bilan.totalPassif)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <p className="text-xs text-center text-slate-400 mt-2">
            Bilan SYSCOHADA révisé 2017 — Montants en FCFA
          </p>
        </div>
      ) : (
        /* ====== COMPTE DE RÉSULTAT ====== */
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`rounded-xl p-4 ${data.resultat.resultatNet >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-xs font-medium uppercase ${data.resultat.resultatNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Résultat net</p>
              <p className={`text-2xl font-bold mt-1 ${data.resultat.resultatNet >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                {data.resultat.resultatNet >= 0 ? '+' : ''}{fmt(data.resultat.resultatNet)}
              </p>
              <p className="text-xs text-slate-500 mt-1">FCFA</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-medium uppercase text-blue-600">EBE</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">{fmt(data.resultat.ebe)}</p>
              <p className="text-xs text-slate-500 mt-1">Excédent brut d'exploitation</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-xs font-medium uppercase text-purple-600">Marge commerciale</p>
              <p className="text-2xl font-bold text-purple-800 mt-1">{fmt(data.resultat.margeCommerciale)}</p>
              <p className="text-xs text-slate-500 mt-1">FCFA</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Produits */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="bg-emerald-700 text-white px-4 py-3">
                <h3 className="font-bold text-sm uppercase tracking-wide">Produits</h3>
              </div>
              <table className="min-w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {data.resultat.produits.map((line, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/30">
                      <td className="px-4 py-2.5 text-slate-700">{line.label}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">{fmt(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-700 text-white">
                    <td className="px-4 py-3 font-bold text-sm">TOTAL PRODUITS</td>
                    <td className="px-4 py-3 text-right font-bold text-sm">
                      {fmt(data.resultat.produits.reduce((s, l) => s + l.amount, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Charges */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="bg-red-700 text-white px-4 py-3">
                <h3 className="font-bold text-sm uppercase tracking-wide">Charges</h3>
              </div>
              <table className="min-w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {data.resultat.charges.map((line, idx) => (
                    <tr key={idx} className="hover:bg-red-50/30">
                      <td className="px-4 py-2.5 text-slate-700">{line.label}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-red-700">{fmt(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-red-700 text-white">
                    <td className="px-4 py-3 font-bold text-sm">TOTAL CHARGES</td>
                    <td className="px-4 py-3 text-right font-bold text-sm">
                      {fmt(data.resultat.charges.reduce((s, l) => s + l.amount, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <p className="text-xs text-center text-slate-400">
            Compte de résultat SYSCOHADA révisé 2017 — Montants en FCFA
          </p>
        </div>
      )}
    </div>
  );
};

export default SyscohadaStatements;
