import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, Printer } from 'lucide-react';
import { getBalanceGenerale, BalanceGeneraleResponse } from '../../services/apiAccounting/apiReports';
import { FiscalYear } from '../../services/apiAccounting/apiPeriods';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import SubsidiaryFilter from '../filters/SubsidiaryFilter';
import DocumentHeader from '../common/DocumentHeader';
import { printElementAsPdf } from '../../utils/pdfExporter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';

interface BalanceGeneraleProps {
  fiscalPeriods: FiscalYear[];
}

const BalanceGenerale: React.FC<BalanceGeneraleProps> = ({ fiscalPeriods }) => {
  const { subsidiary } = useAuth();
  const toast = useToast();
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [subsidiaryId, setSubsidiaryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!fiscalYearId && fiscalPeriods.length > 0) {
      const open = fiscalPeriods.find((p) => !p.isClosed);
      setFiscalYearId((open || fiscalPeriods[0]).id);
    }
  }, [fiscalPeriods, fiscalYearId]);

  const { data, isLoading } = useQuery<BalanceGeneraleResponse>({
    queryKey: ['balance-generale', fiscalYearId, subsidiaryId, startDate, endDate],
    queryFn: () => getBalanceGenerale(fiscalYearId, subsidiaryId || undefined, startDate || undefined, endDate || undefined),
    enabled: !!fiscalYearId,
  });

  const lines = data?.balance ?? [];
  const totaux = data?.totaux;
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n);

  const handlePrint = async () => {
    if (!printRef.current || isPrinting) return;
    setIsPrinting(true);
    try { await printElementAsPdf(printRef.current); }
    finally { setIsPrinting(false); }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFontSize(16);
      doc.text('Balance générale', 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Exercice : ${fiscalPeriods.find((p) => p.id === fiscalYearId)?.name ?? ''} — Imprimé le ${new Date().toLocaleDateString('fr-FR')}`, 14, 21);

      autoTable(doc, {
        startY: 27,
        head: [['N° Compte', 'Intitulé', 'Mouv. Débit', 'Mouv. Crédit', 'Solde débiteur', 'Solde créditeur']],
        body: lines.map((l) => [l.accountNumber, l.accountName, fmt(l.mouvDebit), fmt(l.mouvCredit), l.soldeDebiteur > 0 ? fmt(l.soldeDebiteur) : '—', l.soldeCrediteur > 0 ? fmt(l.soldeCrediteur) : '—']),
        foot: totaux ? [['', 'Totaux généraux', fmt(totaux.totalMouvDebit), fmt(totaux.totalMouvCredit), fmt(totaux.totalSoldeDebiteur), fmt(totaux.totalSoldeCrediteur)]] : undefined,
        theme: 'striped',
        headStyles: { fillColor: [198, 233, 17], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        footStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
      });

      doc.save(`Balance_Generale_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la génération du PDF.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Balance générale</h3>
          <p className="text-sm text-slate-500">Soldes et mouvements de tous les comptes.</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button onClick={handlePrint} disabled={isPrinting || lines.length === 0} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed" title="Imprimer">
            <Printer className="w-5 h-5" />
          </button>
          <button onClick={handleExportPDF} disabled={lines.length === 0} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed" title="Exporter en PDF">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 rounded-xl">
        <SubsidiaryFilter value={subsidiaryId} onChange={setSubsidiaryId} />
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Exercice :</span>
          <select
            value={fiscalYearId}
            onChange={(e) => setFiscalYearId(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-[#c6e911]"
          >
            {fiscalPeriods.length === 0 && <option value="">Aucun exercice</option>}
            {fiscalPeriods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-600">Du</span>
          <input
            type="date"
            className="px-2 py-1 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-[#c6e911]"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-sm font-medium text-slate-600">au</span>
          <input
            type="date"
            className="px-2 py-1 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-[#c6e911]"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-sm">
        {!fiscalYearId ? (
          <EmptyState icon="document" title="Aucun exercice fiscal" description="Créez un exercice fiscal pour consulter la balance." />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider" rowSpan={2}>N° Compte</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider" rowSpan={2}>Intitulé</th>
                <th className="px-4 py-2 text-center text-xs font-bold uppercase" colSpan={2}>Mouvements</th>
                <th className="px-4 py-2 text-center text-xs font-bold uppercase" colSpan={2}>Soldes</th>
              </tr>
              <tr className="bg-slate-700 text-white">
                <th className="px-4 py-2 text-right text-xs font-semibold">Débit</th>
                <th className="px-4 py-2 text-right text-xs font-semibold">Crédit</th>
                <th className="px-4 py-2 text-right text-xs font-semibold">Débiteur</th>
                <th className="px-4 py-2 text-right text-xs font-semibold">Créditeur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableSkeleton rows={8} columns={6} />
              ) : lines.length > 0 ? (
                lines.map((line) => (
                  <tr key={line.accountNumber} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-sm font-mono font-semibold text-slate-800">{line.accountNumber}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-700">{line.accountName}</td>
                    <td className="px-4 py-2.5 text-sm text-right text-blue-700">{fmt(line.mouvDebit)}</td>
                    <td className="px-4 py-2.5 text-sm text-right text-red-700">{fmt(line.mouvCredit)}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium text-slate-800">{line.soldeDebiteur > 0 ? fmt(line.soldeDebiteur) : '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium text-slate-800">{line.soldeCrediteur > 0 ? fmt(line.soldeCrediteur) : '—'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6}><EmptyState icon="document" title="Aucune donnée pour cet exercice" /></td></tr>
              )}
            </tbody>
            {totaux && lines.length > 0 && (
              <tfoot>
                <tr className="bg-slate-800 text-white">
                  <td colSpan={2} className="px-4 py-3 text-sm font-bold uppercase">Totaux généraux</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">{fmt(totaux.totalMouvDebit)}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">{fmt(totaux.totalMouvCredit)}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">{fmt(totaux.totalSoldeDebiteur)}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">{fmt(totaux.totalSoldeCrediteur)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {/* Hidden print template */}
      {subsidiary && (
        <div style={{ display: 'none' }}>
          <div ref={printRef} className="p-8 bg-white" style={{ width: '1100px' }}>
            <DocumentHeader subsidiary={subsidiary} showContactIcons={false} />
            <h2 className="text-xl font-bold text-slate-800 mb-4">Balance générale — {fiscalPeriods.find((p) => p.id === fiscalYearId)?.name}</h2>
            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-2 py-1 text-left">N° Compte</th>
                  <th className="border border-slate-300 px-2 py-1 text-left">Intitulé</th>
                  <th className="border border-slate-300 px-2 py-1 text-right">Mouv. Débit</th>
                  <th className="border border-slate-300 px-2 py-1 text-right">Mouv. Crédit</th>
                  <th className="border border-slate-300 px-2 py-1 text-right">Solde débiteur</th>
                  <th className="border border-slate-300 px-2 py-1 text-right">Solde créditeur</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.accountNumber}>
                    <td className="border border-slate-300 px-2 py-1 font-mono font-bold">{l.accountNumber}</td>
                    <td className="border border-slate-300 px-2 py-1">{l.accountName}</td>
                    <td className="border border-slate-300 px-2 py-1 text-right">{fmt(l.mouvDebit)}</td>
                    <td className="border border-slate-300 px-2 py-1 text-right">{fmt(l.mouvCredit)}</td>
                    <td className="border border-slate-300 px-2 py-1 text-right">{l.soldeDebiteur > 0 ? fmt(l.soldeDebiteur) : '—'}</td>
                    <td className="border border-slate-300 px-2 py-1 text-right">{l.soldeCrediteur > 0 ? fmt(l.soldeCrediteur) : '—'}</td>
                  </tr>
                ))}
              </tbody>
              {totaux && (
                <tfoot>
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={2} className="border border-slate-300 px-2 py-1">Totaux généraux</td>
                    <td className="border border-slate-300 px-2 py-1 text-right">{fmt(totaux.totalMouvDebit)}</td>
                    <td className="border border-slate-300 px-2 py-1 text-right">{fmt(totaux.totalMouvCredit)}</td>
                    <td className="border border-slate-300 px-2 py-1 text-right">{fmt(totaux.totalSoldeDebiteur)}</td>
                    <td className="border border-slate-300 px-2 py-1 text-right">{fmt(totaux.totalSoldeCrediteur)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceGenerale;
