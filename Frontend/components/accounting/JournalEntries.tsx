import React, { useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckCircle2, Eye, Search, X, FileText, Download, Printer, Undo2, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../common/ConfirmationModal';
import DocumentHeader from '../common/DocumentHeader';
import { printElementAsPdf } from '../../utils/pdfExporter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  getEntries, createEntry, postEntry, cancelEntry, reverseEntry,
  JournalEntry, JournalEntryStatus, CreateEntryDto,
} from '../../services/apiAccounting/apiEntries';
import { getJournals, AccountingJournal } from '../../services/apiAccounting/apiJournals';
import { getAccountsPaginated, AccountingAccount } from '../../services/apiAccounting/apiAccounts';
import { FiscalYear } from '../../services/apiAccounting/apiPeriods';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import SubsidiaryFilter from '../filters/SubsidiaryFilter';
import { AsyncSelect } from '../ui/AsyncSelect';

const STATUS_LABELS: Record<JournalEntryStatus, string> = {
  DRAFT: 'Brouillon',
  POSTED: 'Validé',
  CANCELLED: 'Annulé',
};

interface JournalEntriesProps {
  fiscalPeriods: FiscalYear[];
}

type EntryLineForm = { accountId: string; description: string; debitAmount: number; creditAmount: number };

const JournalEntries: React.FC<JournalEntriesProps> = ({ fiscalPeriods }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { subsidiary } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<JournalEntryStatus | ''>('');
  const [filterFiscalYear, setFilterFiscalYear] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterSubsidiaryId, setFilterSubsidiaryId] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'post' | 'cancel' | 'reverse'; entry: JournalEntry } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const emptyLine = (): EntryLineForm => ({ accountId: '', description: '', debitAmount: 0, creditAmount: 0 });
  const [form, setForm] = useState<CreateEntryDto>({
    entryDate: new Date().toISOString().slice(0, 10),
    description: '',
    journalId: '',
    fiscalYearId: '',
    lines: [emptyLine(), emptyLine()],
  });

  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ['accounting-entries', filterFiscalYear, filterStatus, filterStartDate, filterEndDate, filterSubsidiaryId],
    queryFn: () => getEntries(
      filterFiscalYear || undefined,
      filterStatus || undefined,
      filterStartDate || undefined,
      filterEndDate || undefined,
      filterSubsidiaryId || undefined,
    ),
  });

  const { data: journals = [] } = useQuery<AccountingJournal[]>({
    queryKey: ['accounting-journals'],
    queryFn: getJournals,
  });

  const createMutation = useMutation({
    mutationFn: createEntry,
    onSuccess: () => {
      toast.success('Écriture créée avec succès.');
      queryClient.invalidateQueries({ queryKey: ['accounting-entries'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la création.'),
  });

  const postMutation = useMutation({
    mutationFn: postEntry,
    onSuccess: () => {
      toast.success('Écriture validée.');
      queryClient.invalidateQueries({ queryKey: ['accounting-entries'] });
      setConfirmAction(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la validation.'),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelEntry,
    onSuccess: () => {
      toast.success('Écriture annulée.');
      queryClient.invalidateQueries({ queryKey: ['accounting-entries'] });
      setConfirmAction(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Erreur lors de l'annulation."),
  });

  const reverseMutation = useMutation({
    mutationFn: reverseEntry,
    onSuccess: () => {
      toast.success('Extourne créée avec succès.');
      queryClient.invalidateQueries({ queryKey: ['accounting-entries'] });
      setConfirmAction(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Erreur lors de l'extourne."),
  });

  const resetForm = () => {
    setForm({
      entryDate: new Date().toISOString().slice(0, 10),
      description: '',
      journalId: '',
      fiscalYearId: '',
      lines: [emptyLine(), emptyLine()],
    });
  };

  const totalDebit = useMemo(() => form.lines.reduce((s, l) => s + Number(l.debitAmount || 0), 0), [form.lines]);
  const totalCredit = useMemo(() => form.lines.reduce((s, l) => s + Number(l.creditAmount || 0), 0), [form.lines]);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, emptyLine()] }));
  const removeLine = (idx: number) => setForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));
  const updateLine = (idx: number, field: keyof EntryLineForm, value: string | number) => {
    setForm((f) => ({ ...f, lines: f.lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l)) }));
  };

  const handleSubmit = () => {
    if (!form.journalId || !form.description) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (!isBalanced) {
      toast.error('Le total débit doit être égal au total crédit.');
      return;
    }
    if (form.lines.some((l) => !l.accountId)) {
      toast.error('Chaque ligne doit avoir un compte sélectionné.');
      return;
    }
    createMutation.mutate({ ...form, fiscalYearId: form.fiscalYearId || undefined });
  };

  const filteredEntries = useMemo(
    () => entries.filter((e) => e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.sequentialNumber?.toLowerCase().includes(searchTerm.toLowerCase())),
    [entries, searchTerm],
  );

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n);

  const confirmLabels: Record<'post' | 'cancel' | 'reverse', { title: string; message: string; buttonText: string; buttonClass: string }> = {
    post: {
      title: "Valider l'écriture ?",
      message: "L'écriture sera définitivement validée, recevra un numéro de pièce légal et ne pourra plus être modifiée.",
      buttonText: 'Valider',
      buttonClass: 'px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm',
    },
    cancel: {
      title: 'Annuler le brouillon ?',
      message: 'Ce brouillon sera définitivement supprimé. Cette action ne peut pas être annulée.',
      buttonText: 'Annuler le brouillon',
      buttonClass: 'px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm',
    },
    reverse: {
      title: "Extourner l'écriture ?",
      message: "Une nouvelle écriture inversée sera créée et validée immédiatement, sans modifier l'écriture d'origine (intangibilité comptable). Cette action ne peut pas être annulée.",
      buttonText: 'Extourner',
      buttonClass: 'px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm',
    },
  };

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
      doc.text('Journal des écritures', 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Imprimé le ${new Date().toLocaleDateString('fr-FR')}`, 14, 21);

      autoTable(doc, {
        startY: 27,
        head: [['Date', 'N° Pièce', 'Journal', 'Libellé', 'Montant', 'Statut']],
        body: filteredEntries.map((e) => [
          new Date(e.entryDate).toLocaleDateString('fr-FR'),
          e.sequentialNumber || e.entryNumber,
          e.journal?.code ?? '—',
          e.description,
          `${fmt(e.lines.reduce((s, l) => s + Number(l.debitAmount), 0))} FCFA`,
          STATUS_LABELS[e.status],
        ]),
        theme: 'striped',
        headStyles: { fillColor: [198, 233, 17], textColor: [0, 0, 0], fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
      });

      doc.save(`Journal_Ecritures_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la génération du PDF.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Écritures comptables</h3>
          <p className="text-sm text-slate-500">Journal des écritures — brouillons et écritures validées.</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button onClick={handlePrint} disabled={isPrinting} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed" title="Imprimer">
            <Printer className="w-5 h-5" />
          </button>
          <button onClick={handleExportPDF} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Exporter en PDF">
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 rounded-lg hover:bg-[#b5d500] transition-colors shadow-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle écriture</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 rounded-xl">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as JournalEntryStatus | '')}
          className="px-3 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-[#c6e911]"
        >
          <option value="">Tous les statuts</option>
          {(Object.keys(STATUS_LABELS) as JournalEntryStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filterFiscalYear}
          onChange={(e) => setFilterFiscalYear(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-[#c6e911]"
        >
          <option value="">Tous les exercices</option>
          {fiscalPeriods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Du</span>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-[#c6e911]"
          />
          <span className="text-sm font-medium text-slate-600">au</span>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-[#c6e911]"
          />
        </div>
        <SubsidiaryFilter value={filterSubsidiaryId} onChange={setFilterSubsidiaryId} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une écriture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#c6e911]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">N° Pièce</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Journal</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Libellé</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Montant</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableSkeleton rows={8} columns={7} />
            ) : filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => {
                const amount = entry.lines.reduce((s, l) => s + Number(l.debitAmount), 0);
                return (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-800 text-sm font-mono">
                      {entry.sequentialNumber || entry.entryNumber}
                      {entry.reversalOfEntryId && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700">EXTOURNE</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{new Date(entry.entryDate).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-mono font-bold">{entry.journal?.code ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 text-sm max-w-xs truncate">{entry.description}</td>
                    <td className="px-4 py-3 text-slate-800 text-sm text-right font-medium">{fmt(amount)} FCFA</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-semibold uppercase ${entry.status === 'POSTED' ? 'bg-green-50 text-green-700' : entry.status === 'DRAFT' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                        {STATUS_LABELS[entry.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => setViewEntry(entry)} className="p-1.5 text-slate-500 hover:text-[#6b8f00] hover:bg-[#c6e911]/10 rounded transition-colors" title="Voir le détail">
                          <Eye className="w-4 h-4" />
                        </button>
                        {entry.status === 'DRAFT' && (
                          <>
                            <button onClick={() => setConfirmAction({ type: 'post', entry })} className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Valider">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setConfirmAction({ type: 'cancel', entry })} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {entry.status === 'POSTED' && !entry.reversalOfEntryId && (
                          <button onClick={() => setConfirmAction({ type: 'reverse', entry })} className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors" title="Extourner">
                            <Undo2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7}>
                  <EmptyState icon="document" title="Aucune écriture comptable" description="Créez une nouvelle écriture pour commencer." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction.type === 'post') postMutation.mutate(confirmAction.entry.id);
            else if (confirmAction.type === 'cancel') cancelMutation.mutate(confirmAction.entry.id);
            else reverseMutation.mutate(confirmAction.entry.id);
          }}
          title={confirmLabels[confirmAction.type].title}
          message={confirmLabels[confirmAction.type].message}
          confirmButtonText={postMutation.isPending || cancelMutation.isPending || reverseMutation.isPending ? 'En cours...' : confirmLabels[confirmAction.type].buttonText}
          confirmButtonClass={confirmLabels[confirmAction.type].buttonClass}
          isDangerous={confirmAction.type !== 'post'}
        />
      )}

      {/* View entry modal */}
      {viewEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Détail de l'écriture</h2>
                  <p className="text-xs text-slate-500">{viewEntry.sequentialNumber || viewEntry.entryNumber}</p>
                </div>
              </div>
              <button onClick={() => setViewEntry(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Date</p>
                  <p className="text-sm font-semibold text-slate-800">{new Date(viewEntry.entryDate).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Journal</p>
                  <p className="text-sm font-semibold text-slate-800">{viewEntry.journal?.code || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Statut</p>
                  <span className={`text-sm font-semibold ${viewEntry.status === 'POSTED' ? 'text-green-700' : 'text-yellow-700'}`}>
                    {STATUS_LABELS[viewEntry.status]}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Libellé</p>
                <p className="text-sm text-slate-800">{viewEntry.description}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Lignes d'écriture</p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-3 py-2 text-xs font-semibold text-slate-600">Compte</th>
                        <th className="px-3 py-2 text-xs font-semibold text-slate-600">Libellé</th>
                        <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-right">Débit</th>
                        <th className="px-3 py-2 text-xs font-semibold text-slate-600 text-right">Crédit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewEntry.lines.map((line) => (
                        <tr key={line.id} className="text-sm">
                          <td className="px-3 py-2 font-mono text-slate-700">{line.account?.accountNumber || '—'}</td>
                          <td className="px-3 py-2 text-slate-800">{line.description || line.account?.accountName}</td>
                          <td className="px-3 py-2 text-right text-slate-700">{Number(line.debitAmount) > 0 ? fmt(Number(line.debitAmount)) : '—'}</td>
                          <td className="px-3 py-2 text-right text-slate-700">{Number(line.creditAmount) > 0 ? fmt(Number(line.creditAmount)) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-semibold">
                        <td colSpan={2} className="px-3 py-2 text-right text-xs text-slate-600">Totaux</td>
                        <td className="px-3 py-2 text-right text-slate-800">{fmt(viewEntry.lines.reduce((s, l) => s + Number(l.debitAmount), 0))}</td>
                        <td className="px-3 py-2 text-right text-slate-800">{fmt(viewEntry.lines.reduce((s, l) => s + Number(l.creditAmount), 0))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Entry Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Nouvelle écriture comptable</h2>
              <button onClick={() => { setIsCreateModalOpen(false); resetForm(); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date" required value={form.entryDate}
                    onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Journal *</label>
                  <select
                    required value={form.journalId}
                    onChange={(e) => setForm((f) => ({ ...f, journalId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-transparent outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    {journals.map((j) => <option key={j.id} value={j.id}>{j.code} – {j.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Exercice fiscal</label>
                  <select
                    value={form.fiscalYearId}
                    onChange={(e) => setForm((f) => ({ ...f, fiscalYearId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-transparent outline-none"
                  >
                    <option value="">Auto (résolu par date)</option>
                    {fiscalPeriods.filter((p) => !p.isClosed).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Libellé *</label>
                  <input
                    type="text" required value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Libellé de l'écriture"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Lignes d'écriture</h3>
                  <button type="button" onClick={addLine} className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm">
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une ligne</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Compte</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Libellé</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Débit</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Crédit</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form.lines.map((line, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 min-w-[220px]">
                            <AsyncSelect<AccountingAccount>
                              queryKey="journal-entry-accounts"
                              placeholder="—"
                              value={line.accountId || undefined}
                              onChange={(value) => updateLine(idx, 'accountId', value || '')}
                              getOptionLabel={(a) => `${a.accountNumber} – ${a.accountName}`}
                              getOptionValue={(a) => a.id}
                              fetcher={({ page, limit, search }) => getAccountsPaginated({ page, limit, search })}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text" value={line.description}
                              onChange={(e) => updateLine(idx, 'description', e.target.value)}
                              placeholder="Libellé"
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-[#c6e911] outline-none"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number" min="0" value={line.debitAmount || ''}
                              onChange={(e) => updateLine(idx, 'debitAmount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-right focus:ring-1 focus:ring-[#c6e911] outline-none"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number" min="0" value={line.creditAmount || ''}
                              onChange={(e) => updateLine(idx, 'creditAmount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-right focus:ring-1 focus:ring-[#c6e911] outline-none"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            {form.lines.length > 2 && (
                              <button type="button" onClick={() => removeLine(idx)} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-right text-sm text-slate-600">Totaux</td>
                        <td className="px-4 py-3 text-right text-sm">{fmt(totalDebit)} FCFA</td>
                        <td className="px-4 py-3 text-right text-sm">{fmt(totalCredit)} FCFA</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {(totalDebit > 0 || totalCredit > 0) && (
                  <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${isBalanced ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    <span className="font-semibold">{isBalanced ? 'Équilibré' : 'Non équilibré'}</span>
                    <span className="font-bold">Écart : {fmt(Math.abs(totalDebit - totalCredit))} FCFA</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => { setIsCreateModalOpen(false); resetForm(); }} className="px-6 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold">
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isBalanced || createMutation.isPending}
                  className="px-6 py-2.5 bg-[#c6e911] text-slate-800 rounded-lg hover:bg-[#b5d500] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? 'Création...' : 'Créer en brouillon'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print template */}
      {subsidiary && (
        <div style={{ display: 'none' }}>
          <div ref={printRef} className="p-8 bg-white" style={{ width: '1000px' }}>
            <DocumentHeader subsidiary={subsidiary} showContactIcons={false} />
            <h2 className="text-xl font-bold text-slate-800 mb-4">Journal des écritures</h2>
            <table className="w-full text-sm border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-3 py-2 text-left">Date</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">N° Pièce</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Libellé</th>
                  <th className="border border-slate-300 px-3 py-2 text-right">Montant</th>
                  <th className="border border-slate-300 px-3 py-2 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="border border-slate-300 px-3 py-2">{new Date(entry.entryDate).toLocaleDateString('fr-FR')}</td>
                    <td className="border border-slate-300 px-3 py-2">{entry.sequentialNumber || entry.entryNumber}</td>
                    <td className="border border-slate-300 px-3 py-2">{entry.description}</td>
                    <td className="border border-slate-300 px-3 py-2 text-right">{fmt(entry.lines.reduce((s, l) => s + Number(l.debitAmount), 0))} FCFA</td>
                    <td className="border border-slate-300 px-3 py-2 text-center">{STATUS_LABELS[entry.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntries;
