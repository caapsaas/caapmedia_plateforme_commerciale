import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronDown, ChevronRight, Download, Printer } from 'lucide-react';
import { getGrandLivre, GrandLivreAccount } from '../../services/apiAccounting/apiReports';
import { getAccountsPaginated, AccountingAccount } from '../../services/apiAccounting/apiAccounts';
import { AsyncSelect } from '../ui/AsyncSelect';
import { FiscalYear } from '../../services/apiAccounting/apiPeriods';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import SubsidiaryFilter from '../filters/SubsidiaryFilter';
import DocumentHeader from '../common/DocumentHeader';
import { printElementAsPdf } from '../../utils/pdfExporter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import EmptyState from '../ui/EmptyState';

interface GrandLivreProps {
  fiscalPeriods: FiscalYear[];
}

const GrandLivre: React.FC<GrandLivreProps> = ({ fiscalPeriods }) => {
  const { subsidiary } = useAuth();
  const toast = useToast();
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [subsidiaryId, setSubsidiaryId] = useState('');
  const [selectedAccountNumber, setSelectedAccountNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!fiscalYearId && fiscalPeriods.length > 0) {
      const open = fiscalPeriods.find((p) => !p.isClosed);
      setFiscalYearId((open || fiscalPeriods[0]).id);
    }
  }, [fiscalPeriods, fiscalYearId]);

  const { data: accounts = [], isLoading } = useQuery<GrandLivreAccount[]>({
    queryKey: ['grand-livre', fiscalYearId, subsidiaryId, selectedAccountNumber, startDate, endDate],
    queryFn: () => getGrandLivre(
      fiscalYearId,
      selectedAccountNumber || undefined,
      undefined,
      subsidiaryId || undefined,
      startDate || undefined,
      endDate || undefined,
    ),
    enabled: !!fiscalYearId,
  });

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR');

  const totalDebit = accounts.reduce((s, a) => s + a.totalDebit, 0);
  const totalCredit = accounts.reduce((s, a) => s + a.totalCredit, 0);

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
      doc.text('Grand livre', 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Exercice : ${fiscalPeriods.find((p) => p.id === fiscalYearId)?.name ?? ''} — Imprimé le ${new Date().toLocaleDateString('fr-FR')}`, 14, 21);

      let startY = 27;
      accounts.forEach((entry) => {
        autoTable(doc, {
          startY,
          head: [[`${entry.account.accountNumber} — ${entry.account.accountName}`, '', '', '', '']],
          body: [],
          theme: 'plain',
          headStyles: { fontSize: 10, fontStyle: 'bold', textColor: [40, 40, 40] },
        });
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY,
          head: [['Date', 'N° Écriture', 'Description', 'Débit', 'Crédit']],
          body: entry.movements.map((m) => [fmtDate(m.date), m.entryNumber, m.description, m.debit > 0 ? fmt(m.debit) : '—', m.credit > 0 ? fmt(m.credit) : '—']),
          foot: [['', '', 'Totaux', fmt(entry.totalDebit), fmt(entry.totalCredit)]],
          theme: 'striped',
          headStyles: { fillColor: [198, 233, 17], textColor: [0, 0, 0], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          footStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
        });
        startY = (doc as any).lastAutoTable.finalY + 6;
        if (startY > 180) { doc.addPage(); startY = 15; }
      });

      doc.save(`Grand_Livre_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la génération du PDF.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Grand livre</h3>
          <p className="text-sm text-slate-500">Détail des mouvements par compte.</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button onClick={handlePrint} disabled={isPrinting || accounts.length === 0} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed" title="Imprimer">
            <Printer className="w-5 h-5" />
          </button>
          <button onClick={handleExportPDF} disabled={accounts.length === 0} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed" title="Exporter en PDF">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
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
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-600">Compte :</span>
          <AsyncSelect<AccountingAccount>
            queryKey="grand-livre-accounts"
            placeholder="Tous les comptes mouvementés"
            className="min-w-[260px]"
            value={selectedAccountNumber || undefined}
            onChange={(value) => setSelectedAccountNumber(value || '')}
            getOptionLabel={(a) => `${a.accountNumber} — ${a.accountName}`}
            getOptionValue={(a) => a.accountNumber}
            fetcher={({ page, limit, search }) => getAccountsPaginated({ page, limit, search })}
          />
        </div>
      </div>

      {!fiscalYearId ? (
        <EmptyState icon="document" title="Aucun exercice fiscal" description="Créez un exercice fiscal dans l'onglet Paramètres pour consulter le grand livre." />
      ) : isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Chargement du grand livre...</div>
      ) : accounts.length === 0 ? (
        <EmptyState icon="document" title="Aucune écriture validée" description="Aucun mouvement comptable pour cet exercice." />
      ) : (
        <>
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

          <div className="space-y-2">
            {accounts.map((entry) => {
              const isExpanded = !!selectedAccountNumber || expandedAccount === entry.account.accountNumber;
              return (
                <div key={entry.account.accountNumber} className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                    onClick={() => setExpandedAccount(isExpanded ? null : entry.account.accountNumber)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      <span className="font-mono font-semibold text-slate-800">{entry.account.accountNumber}</span>
                      <span className="text-slate-600 text-sm">{entry.account.accountName}</span>
                      <span className="text-xs text-slate-400">({entry.movements.length} mvt.)</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span className="text-blue-700 font-medium">{fmt(entry.totalDebit)}</span>
                      <span className="text-red-700 font-medium">{fmt(entry.totalCredit)}</span>
                      <span className={`font-bold ${entry.balance >= 0 ? 'text-slate-800' : 'text-red-700'}`}>
                        {entry.balance >= 0 ? `SD ${fmt(entry.balance)}` : `SC ${fmt(Math.abs(entry.balance))}`}
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
                          {entry.movements.map((mvt, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-2 text-slate-600">{fmtDate(mvt.date)}</td>
                              <td className="px-4 py-2 font-mono text-slate-700">{mvt.entryNumber}</td>
                              <td className="px-4 py-2 text-slate-600 max-w-xs truncate">{mvt.description}</td>
                              <td className="px-4 py-2 text-right text-blue-700">{mvt.debit > 0 ? fmt(mvt.debit) : '—'}</td>
                              <td className="px-4 py-2 text-right text-red-700">{mvt.credit > 0 ? fmt(mvt.credit) : '—'}</td>
                              <td className={`px-4 py-2 text-right font-medium ${mvt.runningBalance >= 0 ? 'text-slate-800' : 'text-red-700'}`}>
                                {fmt(Math.abs(mvt.runningBalance))} {mvt.runningBalance >= 0 ? 'D' : 'C'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100">
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Totaux</td>
                            <td className="px-4 py-2 text-right text-xs font-bold text-blue-800">{fmt(entry.totalDebit)}</td>
                            <td className="px-4 py-2 text-right text-xs font-bold text-red-800">{fmt(entry.totalCredit)}</td>
                            <td className="px-4 py-2 text-right text-xs font-bold text-slate-800">
                              {entry.balance >= 0 ? `SD ${fmt(entry.balance)}` : `SC ${fmt(Math.abs(entry.balance))}`}
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

      {/* Hidden print template */}
      {subsidiary && (
        <div style={{ display: 'none' }}>
          <div ref={printRef} className="p-8 bg-white" style={{ width: '1100px' }}>
            <DocumentHeader subsidiary={subsidiary} showContactIcons={false} />
            <h2 className="text-xl font-bold text-slate-800 mb-4">Grand livre — {fiscalPeriods.find((p) => p.id === fiscalYearId)?.name}</h2>
            {accounts.map((entry) => (
              <div key={entry.account.accountNumber} className="mb-6">
                <div className="font-bold text-sm mb-2 px-2 bg-slate-50 py-1">{entry.account.accountNumber} — {entry.account.accountName}</div>
                <table className="w-full text-xs border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-2 py-1 text-left">Date</th>
                      <th className="border border-slate-300 px-2 py-1 text-left">N° Écriture</th>
                      <th className="border border-slate-300 px-2 py-1 text-left">Description</th>
                      <th className="border border-slate-300 px-2 py-1 text-right">Débit</th>
                      <th className="border border-slate-300 px-2 py-1 text-right">Crédit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.movements.map((mvt, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-300 px-2 py-1">{fmtDate(mvt.date)}</td>
                        <td className="border border-slate-300 px-2 py-1 font-mono">{mvt.entryNumber}</td>
                        <td className="border border-slate-300 px-2 py-1">{mvt.description}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right">{mvt.debit > 0 ? fmt(mvt.debit) : '—'}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right">{mvt.credit > 0 ? fmt(mvt.credit) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={3} className="border border-slate-300 px-2 py-1 text-right">Totaux</td>
                      <td className="border border-slate-300 px-2 py-1 text-right">{fmt(entry.totalDebit)}</td>
                      <td className="border border-slate-300 px-2 py-1 text-right">{fmt(entry.totalCredit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GrandLivre;
