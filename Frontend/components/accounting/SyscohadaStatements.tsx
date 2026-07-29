import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, FileText, Printer } from 'lucide-react';
import { getSyscohadaStatements, SyscohadaStatements as StatementsType } from '../../services/apiAccounting/apiReports';
import { FiscalYear } from '../../services/apiAccounting/apiPeriods';
import SubsidiaryFilter from '../filters/SubsidiaryFilter';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DocumentHeader from '../common/DocumentHeader';
import { printElementAsPdf } from '../../utils/pdfExporter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SyscohadaStatementsProps {
  fiscalPeriods: FiscalYear[];
}

const ACTIF_LABELS: Record<keyof StatementsType['bilan']['actif'], string> = {
  immobilisationsNettes: 'Immobilisations nettes',
  stocks: 'Stocks',
  creancesClients: 'Créances clients',
  tvaDeductible: 'TVA déductible',
  tresorerie: 'Trésorerie',
  totalActif: 'Total Actif',
};

const PASSIF_LABELS: Record<keyof StatementsType['bilan']['passif'], string> = {
  capitalSocial: 'Capital social',
  reserves: 'Réserves',
  resultatExercice: "Résultat de l'exercice",
  dettesLongTerme: 'Dettes à long terme',
  dettesFournisseurs: 'Dettes fournisseurs',
  tvaCollectee: 'TVA collectée',
  autresDettes: 'Autres dettes',
  totalPassif: 'Total Passif',
};

const PRODUITS_LABELS: Record<keyof StatementsType['comptResultat']['produits'], string> = {
  ventesMarchandises: 'Ventes de marchandises',
  prestationsServices: 'Prestations de services',
  autresProduits: 'Autres produits',
};

const CHARGES_LABELS: Record<keyof StatementsType['comptResultat']['charges'], string> = {
  achatsMarchandises: 'Achats de marchandises',
  chargesExternes: 'Charges externes',
  chargesPersonnel: 'Charges de personnel',
  dotationsAmort: 'Dotations aux amortissements',
  chargesFinancieres: 'Charges financières',
  autresCharges: 'Autres charges',
  is: 'Impôt sur les sociétés',
};

const lineEntries = <T extends Record<string, number>>(obj: T, labels: Record<keyof T, string>, excludeKeys: (keyof T)[] = []) =>
  (Object.keys(obj) as (keyof T)[])
    .filter((k) => !excludeKeys.includes(k))
    .map((k) => ({ label: labels[k], amount: obj[k] }));

const SyscohadaStatements: React.FC<SyscohadaStatementsProps> = ({ fiscalPeriods }) => {
  const { subsidiary } = useAuth();
  const toast = useToast();
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [subsidiaryId, setSubsidiaryId] = useState('');
  const [activeStatement, setActiveStatement] = useState<'bilan' | 'resultat'>('bilan');
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!fiscalYearId && fiscalPeriods.length > 0) {
      const open = fiscalPeriods.find((p) => !p.isClosed);
      setFiscalYearId((open || fiscalPeriods[0]).id);
    }
  }, [fiscalPeriods, fiscalYearId]);

  const { data, isLoading } = useQuery<StatementsType>({
    queryKey: ['syscohada-statements', fiscalYearId, subsidiaryId],
    queryFn: () => getSyscohadaStatements(fiscalYearId, subsidiaryId || undefined),
    enabled: !!fiscalYearId,
  });

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n);

  const isBalanced = data ? Math.abs(data.bilan.actif.totalActif - data.bilan.passif.totalPassif) < 1 : true;

  const handlePrint = async () => {
    if (!printRef.current || isPrinting) return;
    setIsPrinting(true);
    try { await printElementAsPdf(printRef.current); }
    finally { setIsPrinting(false); }
  };

  const handleExportPDF = () => {
    if (!data) return;
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      doc.setFontSize(16);
      doc.text(activeStatement === 'bilan' ? 'Bilan SYSCOHADA' : 'Compte de résultat SYSCOHADA', 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Exercice : ${fiscalPeriods.find((p) => p.id === fiscalYearId)?.name ?? ''} — Imprimé le ${new Date().toLocaleDateString('fr-FR')}`, 14, 21);

      if (activeStatement === 'bilan') {
        autoTable(doc, {
          startY: 27,
          head: [['ACTIF', 'Montant']],
          body: lineEntries(data.bilan.actif, ACTIF_LABELS, ['totalActif']).map((l) => [l.label, fmt(l.amount)]),
          foot: [['TOTAL ACTIF', fmt(data.bilan.actif.totalActif)]],
          theme: 'striped',
          headStyles: { fillColor: [198, 233, 17], textColor: [0, 0, 0], fontSize: 8 },
          footStyles: { fillColor: [230, 230, 230], fontStyle: 'bold', fontSize: 8 },
        });
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 8,
          head: [['PASSIF', 'Montant']],
          body: lineEntries(data.bilan.passif, PASSIF_LABELS, ['totalPassif']).map((l) => [l.label, fmt(l.amount)]),
          foot: [['TOTAL PASSIF', fmt(data.bilan.passif.totalPassif)]],
          theme: 'striped',
          headStyles: { fillColor: [198, 233, 17], textColor: [0, 0, 0], fontSize: 8 },
          footStyles: { fillColor: [230, 230, 230], fontStyle: 'bold', fontSize: 8 },
        });
      } else {
        autoTable(doc, {
          startY: 27,
          head: [['PRODUITS', 'Montant']],
          body: lineEntries(data.comptResultat.produits, PRODUITS_LABELS).map((l) => [l.label, fmt(l.amount)]),
          foot: [['TOTAL PRODUITS', fmt(data.comptResultat.totalProduits)]],
          theme: 'striped',
          headStyles: { fillColor: [198, 233, 17], textColor: [0, 0, 0], fontSize: 8 },
          footStyles: { fillColor: [230, 230, 230], fontStyle: 'bold', fontSize: 8 },
        });
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 8,
          head: [['CHARGES', 'Montant']],
          body: lineEntries(data.comptResultat.charges, CHARGES_LABELS).map((l) => [l.label, fmt(l.amount)]),
          foot: [['TOTAL CHARGES', fmt(data.comptResultat.totalCharges)], ['RÉSULTAT NET', fmt(data.comptResultat.resultatNet)]],
          theme: 'striped',
          headStyles: { fillColor: [198, 233, 17], textColor: [0, 0, 0], fontSize: 8 },
          footStyles: { fillColor: [230, 230, 230], fontStyle: 'bold', fontSize: 8 },
        });
      }

      doc.save(`${activeStatement === 'bilan' ? 'Bilan' : 'Compte_Resultat'}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la génération du PDF.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-slate-700">Exercice :</label>
            <select
              value={fiscalYearId}
              onChange={(e) => setFiscalYearId(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
            >
              {fiscalPeriods.length === 0 && <option value="">Aucun exercice</option>}
              {fiscalPeriods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <SubsidiaryFilter value={subsidiaryId} onChange={setSubsidiaryId} />
          <div className="flex rounded-lg overflow-hidden border border-slate-200">
            <button
              onClick={() => setActiveStatement('bilan')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeStatement === 'bilan' ? 'bg-[#c6e911] text-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              <BarChart3 className="w-4 h-4" />
              Bilan
            </button>
            <button
              onClick={() => setActiveStatement('resultat')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeStatement === 'resultat' ? 'bg-[#c6e911] text-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              <FileText className="w-4 h-4" />
              Compte de résultat
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handlePrint} disabled={isPrinting || !data} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed" title="Imprimer">
            <Printer className="w-5 h-5" />
          </button>
          <button onClick={handleExportPDF} disabled={!data} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed" title="Exporter en PDF">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!fiscalYearId ? (
        <div className="py-12 text-center text-slate-400">Créez un exercice fiscal pour consulter les états financiers.</div>
      ) : isLoading ? (
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
                    <th className="px-4 py-2 text-right text-xs text-blue-700 font-semibold">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineEntries(data.bilan.actif, ACTIF_LABELS, ['totalActif']).map((line) => (
                    <tr key={line.label} className="hover:bg-blue-50/30">
                      <td className="px-4 py-2.5 text-slate-700">{line.label}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmt(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-700 text-white">
                    <td className="px-4 py-3 font-bold text-sm">TOTAL ACTIF</td>
                    <td className="px-4 py-3 text-right font-bold text-sm">{fmt(data.bilan.actif.totalActif)}</td>
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
                  {lineEntries(data.bilan.passif, PASSIF_LABELS, ['totalPassif']).map((line) => (
                    <tr key={line.label} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-700">{line.label}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${line.amount < 0 ? 'text-red-600' : 'text-slate-800'}`}>{fmt(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-700 text-white">
                    <td className="px-4 py-3 font-bold text-sm">TOTAL PASSIF</td>
                    <td className="px-4 py-3 text-right font-bold text-sm">{fmt(data.bilan.passif.totalPassif)}</td>
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
            <div className={`rounded-xl p-4 ${data.comptResultat.resultatNet >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-xs font-medium uppercase ${data.comptResultat.resultatNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Résultat net</p>
              <p className={`text-2xl font-bold mt-1 ${data.comptResultat.resultatNet >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                {data.comptResultat.resultatNet >= 0 ? '+' : ''}{fmt(data.comptResultat.resultatNet)}
              </p>
              <p className="text-xs text-slate-500 mt-1">FCFA</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-medium uppercase text-blue-600">EBE</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">{fmt(data.comptResultat.ebe)}</p>
              <p className="text-xs text-slate-500 mt-1">Excédent brut d'exploitation</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-xs font-medium uppercase text-purple-600">Marge commerciale</p>
              <p className="text-2xl font-bold text-purple-800 mt-1">{fmt(data.comptResultat.margeCommerciale)}</p>
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
                  {lineEntries(data.comptResultat.produits, PRODUITS_LABELS).map((line) => (
                    <tr key={line.label} className="hover:bg-emerald-50/30">
                      <td className="px-4 py-2.5 text-slate-700">{line.label}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">{fmt(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-700 text-white">
                    <td className="px-4 py-3 font-bold text-sm">TOTAL PRODUITS</td>
                    <td className="px-4 py-3 text-right font-bold text-sm">{fmt(data.comptResultat.totalProduits)}</td>
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
                  {lineEntries(data.comptResultat.charges, CHARGES_LABELS).map((line) => (
                    <tr key={line.label} className="hover:bg-red-50/30">
                      <td className="px-4 py-2.5 text-slate-700">{line.label}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-red-700">{fmt(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-red-700 text-white">
                    <td className="px-4 py-3 font-bold text-sm">TOTAL CHARGES</td>
                    <td className="px-4 py-3 text-right font-bold text-sm">{fmt(data.comptResultat.totalCharges)}</td>
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

      {/* Hidden print template */}
      {subsidiary && data && (
        <div style={{ display: 'none' }}>
          <div ref={printRef} className="p-8 bg-white" style={{ width: '900px' }}>
            <DocumentHeader subsidiary={subsidiary} showContactIcons={false} />
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {activeStatement === 'bilan' ? 'Bilan' : 'Compte de résultat'} SYSCOHADA — {fiscalPeriods.find((p) => p.id === fiscalYearId)?.name}
            </h2>
            {activeStatement === 'bilan' ? (
              <div className="grid grid-cols-2 gap-6">
                <table className="w-full text-xs border-collapse border border-slate-300">
                  <thead><tr className="bg-slate-100"><th className="border border-slate-300 px-2 py-1 text-left" colSpan={2}>ACTIF</th></tr></thead>
                  <tbody>
                    {lineEntries(data.bilan.actif, ACTIF_LABELS, ['totalActif']).map((l) => (
                      <tr key={l.label}><td className="border border-slate-300 px-2 py-1">{l.label}</td><td className="border border-slate-300 px-2 py-1 text-right">{fmt(l.amount)}</td></tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="bg-slate-50 font-bold"><td className="border border-slate-300 px-2 py-1">TOTAL ACTIF</td><td className="border border-slate-300 px-2 py-1 text-right">{fmt(data.bilan.actif.totalActif)}</td></tr></tfoot>
                </table>
                <table className="w-full text-xs border-collapse border border-slate-300">
                  <thead><tr className="bg-slate-100"><th className="border border-slate-300 px-2 py-1 text-left" colSpan={2}>PASSIF</th></tr></thead>
                  <tbody>
                    {lineEntries(data.bilan.passif, PASSIF_LABELS, ['totalPassif']).map((l) => (
                      <tr key={l.label}><td className="border border-slate-300 px-2 py-1">{l.label}</td><td className="border border-slate-300 px-2 py-1 text-right">{fmt(l.amount)}</td></tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="bg-slate-50 font-bold"><td className="border border-slate-300 px-2 py-1">TOTAL PASSIF</td><td className="border border-slate-300 px-2 py-1 text-right">{fmt(data.bilan.passif.totalPassif)}</td></tr></tfoot>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <table className="w-full text-xs border-collapse border border-slate-300">
                  <thead><tr className="bg-slate-100"><th className="border border-slate-300 px-2 py-1 text-left" colSpan={2}>PRODUITS</th></tr></thead>
                  <tbody>
                    {lineEntries(data.comptResultat.produits, PRODUITS_LABELS).map((l) => (
                      <tr key={l.label}><td className="border border-slate-300 px-2 py-1">{l.label}</td><td className="border border-slate-300 px-2 py-1 text-right">{fmt(l.amount)}</td></tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="bg-slate-50 font-bold"><td className="border border-slate-300 px-2 py-1">TOTAL PRODUITS</td><td className="border border-slate-300 px-2 py-1 text-right">{fmt(data.comptResultat.totalProduits)}</td></tr></tfoot>
                </table>
                <table className="w-full text-xs border-collapse border border-slate-300">
                  <thead><tr className="bg-slate-100"><th className="border border-slate-300 px-2 py-1 text-left" colSpan={2}>CHARGES</th></tr></thead>
                  <tbody>
                    {lineEntries(data.comptResultat.charges, CHARGES_LABELS).map((l) => (
                      <tr key={l.label}><td className="border border-slate-300 px-2 py-1">{l.label}</td><td className="border border-slate-300 px-2 py-1 text-right">{fmt(l.amount)}</td></tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold"><td className="border border-slate-300 px-2 py-1">TOTAL CHARGES</td><td className="border border-slate-300 px-2 py-1 text-right">{fmt(data.comptResultat.totalCharges)}</td></tr>
                    <tr className="bg-slate-100 font-bold"><td className="border border-slate-300 px-2 py-1">RÉSULTAT NET</td><td className="border border-slate-300 px-2 py-1 text-right">{fmt(data.comptResultat.resultatNet)}</td></tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SyscohadaStatements;
