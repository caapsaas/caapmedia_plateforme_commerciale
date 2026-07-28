import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Calendar, ChevronDown, ChevronRight, Download, Printer } from 'lucide-react';
import { getJournalCentralisateur, JournalCentralisateurGroup } from '../../services/apiAccounting/apiReports';
import { FiscalYear } from '../../services/apiAccounting/apiPeriods';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import SubsidiaryFilter from '../filters/SubsidiaryFilter';
import DocumentHeader from '../common/DocumentHeader';
import { printElementAsPdf } from '../../utils/pdfExporter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import EmptyState from '../ui/EmptyState';

interface JournalCentralisateurProps {
  fiscalPeriods: FiscalYear[];
}

const JOURNAL_COLORS: Record<string, string> = {
  JV: 'bg-green-100 text-green-800',
  JA: 'bg-blue-100 text-blue-800',
  JB: 'bg-purple-100 text-purple-800',
  JC: 'bg-teal-100 text-teal-800',
  JOD: 'bg-orange-100 text-orange-800',
};

const JournalCentralisateur: React.FC<JournalCentralisateurProps> = ({ fiscalPeriods }) => {
  const { subsidiary } = useAuth();
  const toast = useToast();
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [subsidiaryId, setSubsidiaryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedJournal, setExpandedJournal] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!fiscalYearId && fiscalPeriods.length > 0) {
      const open = fiscalPeriods.find((p) => !p.isClosed);
      setFiscalYearId((open || fiscalPeriods[0]).id);
    }
  }, [fiscalPeriods, fiscalYearId]);

  const { data: journals = [], isLoading } = useQuery<JournalCentralisateurGroup[]>({
    queryKey: ['journal-centralisateur', fiscalYearId, subsidiaryId, startDate, endDate],
    queryFn: () => getJournalCentralisateur(fiscalYearId, undefined, subsidiaryId || undefined, startDate || undefined, endDate || undefined),
    enabled: !!fiscalYearId,
  });

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR');

  const grandTotalDebit = journals.reduce((s, j) => s + j.totalDebit, 0);
  const grandTotalCredit = journals.reduce((s, j) => s + j.totalCredit, 0);

  const handlePrint = async () => {
    if (!printRef.current || isPrinting) return;
    setIsPrinting(true);
    try { await printElementAsPdf(printRef.current); }
    finally { setIsPrinting(false); }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      doc.setFontSize(16);
      doc.text('Journal centralisateur', 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Exercice : ${fiscalPeriods.find((p) => p.id === fiscalYearId)?.name ?? ''} — Imprimé le ${new Date().toLocaleDateString('fr-FR')}`, 14, 21);

      let startY = 27;
      journals.forEach((group) => {
        const code = group.journal?.code ?? 'JOD';
        autoTable(doc, {
          startY,
          head: [[`${code} — ${group.journal?.name ?? ''}`]],
          body: [],
          theme: 'plain',
          headStyles: { fontSize: 10, fontStyle: 'bold', textColor: [40, 40, 40] },
        });
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY,
          head: [['N° Écriture', 'Date', 'Description', 'Débit', 'Crédit']],
          body: group.entries.map((e) => [e.entryNumber, fmtDate(e.date), e.description, e.totalDebit > 0 ? fmt(e.totalDebit) : '—', e.totalCredit > 0 ? fmt(e.totalCredit) : '—']),
          foot: [['', '', `Total ${code}`, fmt(group.totalDebit), fmt(group.totalCredit)]],
          theme: 'striped',
          headStyles: { fillColor: [198, 233, 17], textColor: [0, 0, 0], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          footStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
        });
        startY = (doc as any).lastAutoTable.finalY + 6;
        if (startY > 260) { doc.addPage(); startY = 15; }
      });

      doc.save(`Journal_Centralisateur_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la génération du PDF.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Journal centralisateur</h3>
          <p className="text-sm text-slate-500">Écritures regroupées par journal.</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button onClick={handlePrint} disabled={isPrinting || journals.length === 0} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed" title="Imprimer">
            <Printer className="w-5 h-5" />
          </button>
          <button onClick={handleExportPDF} disabled={journals.length === 0} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed" title="Exporter en PDF">
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

      {!fiscalYearId ? (
        <EmptyState icon="document" title="Aucun exercice fiscal" description="Créez un exercice fiscal pour consulter le journal centralisateur." />
      ) : isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Chargement...</div>
      ) : journals.length === 0 ? (
        <EmptyState icon="document" title="Aucune donnée pour cet exercice" />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {journals.map((j) => {
              const code = j.journal?.code ?? 'JOD';
              return (
                <div key={code} className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${JOURNAL_COLORS[code] ?? 'bg-slate-100 text-slate-700'}`}>{code}</span>
                    <span className="text-xs text-slate-500 truncate">{j.journal?.name}</span>
                  </div>
                  <p className="text-sm text-blue-700 font-medium">{fmt(j.totalDebit)} D</p>
                  <p className="text-sm text-red-700 font-medium">{fmt(j.totalCredit)} C</p>
                  <p className="text-xs text-slate-400 mt-1">{j.entries.length} écriture(s)</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            {journals.map((group) => {
              const code = group.journal?.code ?? 'JOD';
              const isExpanded = expandedJournal === code;
              return (
                <div key={code} className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                    onClick={() => setExpandedJournal(isExpanded ? null : code)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${JOURNAL_COLORS[code] ?? 'bg-slate-100 text-slate-700'}`}>{code}</span>
                      <span className="font-semibold text-slate-800">{group.journal?.name}</span>
                      <span className="text-xs text-slate-400">({group.entries.length} écriture(s))</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span className="text-blue-700 font-bold">{fmt(group.totalDebit)}</span>
                      <span className="text-red-700 font-bold">{fmt(group.totalCredit)}</span>
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
                          {group.entries.map((entry, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-2 font-mono text-slate-700">{entry.entryNumber}</td>
                              <td className="px-4 py-2 text-slate-600">{fmtDate(entry.date)}</td>
                              <td className="px-4 py-2 text-slate-600 max-w-xs truncate">{entry.description}</td>
                              <td className="px-4 py-2 text-right text-blue-700">{entry.totalDebit > 0 ? fmt(entry.totalDebit) : '—'}</td>
                              <td className="px-4 py-2 text-right text-red-700">{entry.totalCredit > 0 ? fmt(entry.totalCredit) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100">
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Total {code}</td>
                            <td className="px-4 py-2 text-right text-xs font-bold text-blue-800">{fmt(group.totalDebit)}</td>
                            <td className="px-4 py-2 text-right text-xs font-bold text-red-800">{fmt(group.totalCredit)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-slate-800 text-white rounded-xl p-4 flex justify-between items-center">
            <span className="flex items-center gap-2 font-bold text-sm uppercase"><BookOpen className="w-4 h-4" /> Totaux généraux</span>
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

      {/* Hidden print template */}
      {subsidiary && (
        <div style={{ display: 'none' }}>
          <div ref={printRef} className="p-8 bg-white" style={{ width: '1000px' }}>
            <DocumentHeader subsidiary={subsidiary} showContactIcons={false} />
            <h2 className="text-xl font-bold text-slate-800 mb-4">Journal centralisateur — {fiscalPeriods.find((p) => p.id === fiscalYearId)?.name}</h2>
            {journals.map((group) => {
              const code = group.journal?.code ?? 'JOD';
              return (
                <div key={code} className="mb-6">
                  <div className="font-bold text-sm mb-2 px-2 bg-slate-50 py-1">{code} — {group.journal?.name}</div>
                  <table className="w-full text-xs border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 px-2 py-1 text-left">N° Écriture</th>
                        <th className="border border-slate-300 px-2 py-1 text-left">Date</th>
                        <th className="border border-slate-300 px-2 py-1 text-left">Description</th>
                        <th className="border border-slate-300 px-2 py-1 text-right">Débit</th>
                        <th className="border border-slate-300 px-2 py-1 text-right">Crédit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.entries.map((entry, idx) => (
                        <tr key={idx}>
                          <td className="border border-slate-300 px-2 py-1 font-mono">{entry.entryNumber}</td>
                          <td className="border border-slate-300 px-2 py-1">{fmtDate(entry.date)}</td>
                          <td className="border border-slate-300 px-2 py-1">{entry.description}</td>
                          <td className="border border-slate-300 px-2 py-1 text-right">{entry.totalDebit > 0 ? fmt(entry.totalDebit) : '—'}</td>
                          <td className="border border-slate-300 px-2 py-1 text-right">{entry.totalCredit > 0 ? fmt(entry.totalCredit) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold">
                        <td colSpan={3} className="border border-slate-300 px-2 py-1 text-right">Total {code}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right">{fmt(group.totalDebit)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right">{fmt(group.totalCredit)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalCentralisateur;
