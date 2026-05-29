import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import {
  getEntries, getJournals, getAccounts, createEntry, postEntry, cancelEntry,
  JournalEntry, JournalEntryStatus, AccountingJournal, AccountingAccount, CreateEntryDto, FiscalPeriod,
} from '../../services/apiAccounting/apiAccounting';

const STATUS_LABELS: Record<JournalEntryStatus, string> = {
  DRAFT: 'Brouillon',
  POSTED: 'Validé',
  CANCELLED: 'Annulé',
};

const STATUS_COLORS: Record<JournalEntryStatus, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  POSTED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

interface JournalEntriesProps {
  fiscalPeriods: FiscalPeriod[];
}

const JournalEntries: React.FC<JournalEntriesProps> = ({ fiscalPeriods }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [filterStatus, setFilterStatus] = useState<JournalEntryStatus | ''>('');
  const [filterFiscalYear, setFilterFiscalYear] = useState('');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'post' | 'cancel'; id: string } | null>(null);

  // Form state
  const emptyLine = () => ({ accountId: '', label: '', debit: 0, credit: 0 });
  const [form, setForm] = useState<Omit<CreateEntryDto, 'fiscalYearId'> & { fiscalYearId: string }>({
    entryDate: new Date().toISOString().slice(0, 10),
    description: '',
    journalId: '',
    fiscalYearId: '',
    lines: [emptyLine(), emptyLine()],
  });

  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ['accounting-entries', filterFiscalYear, filterStatus],
    queryFn: () => getEntries(filterFiscalYear || undefined, filterStatus || undefined),
  });

  const { data: journals = [] } = useQuery<AccountingJournal[]>({
    queryKey: ['accounting-journals'],
    queryFn: getJournals,
  });

  const { data: accounts = [] } = useQuery<AccountingAccount[]>({
    queryKey: ['accounting-accounts'],
    queryFn: () => getAccounts(),
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
      toast.success('Écriture annulée par contre-passation.');
      queryClient.invalidateQueries({ queryKey: ['accounting-entries'] });
      setConfirmAction(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de l\'annulation.'),
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

  const totalDebit = useMemo(() => form.lines.reduce((s, l) => s + Number(l.debit), 0), [form.lines]);
  const totalCredit = useMemo(() => form.lines.reduce((s, l) => s + Number(l.credit), 0), [form.lines]);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, emptyLine()] }));
  const removeLine = (idx: number) => setForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));
  const updateLine = (idx: number, field: string, value: string | number) => {
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l, i) => i === idx ? { ...l, [field]: value } : l),
    }));
  };

  const handleSubmit = () => {
    if (!form.journalId || !form.fiscalYearId || !form.description) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (!isBalanced) {
      toast.error('Le total débit doit être égal au total crédit.');
      return;
    }
    createMutation.mutate(form);
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as JournalEntryStatus | '')}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
          >
            <option value="">Tous les statuts</option>
            {(Object.keys(STATUS_LABELS) as JournalEntryStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={filterFiscalYear}
            onChange={(e) => setFilterFiscalYear(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
          >
            <option value="">Tous les exercices</option>
            {fiscalPeriods.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 text-sm bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#b5d500] transition-colors"
        >
          + Nouvelle écriture
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase w-6"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">N° Écriture</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Journal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Débit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Crédit</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Chargement...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Aucune écriture comptable.</td></tr>
              ) : (
                entries.map((entry) => {
                  const entryDebit = entry.lines.reduce((s, l) => s + Number(l.debit), 0);
                  const entryCredit = entry.lines.reduce((s, l) => s + Number(l.credit), 0);
                  const isExpanded = expandedEntry === entry.id;
                  return (
                    <React.Fragment key={entry.id}>
                      <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}>
                        <td className="px-4 py-3 text-slate-400 text-xs">{isExpanded ? '▼' : '▶'}</td>
                        <td className="px-4 py-3 text-sm font-mono text-slate-800">{entry.entryNumber}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{new Date(entry.entryDate).toLocaleDateString('fr-FR')}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">{entry.journal?.code ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{entry.description}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-800">{fmt(entryDebit)}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-800">{fmt(entryCredit)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[entry.status]}`}>
                            {STATUS_LABELS[entry.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2 justify-end">
                            {entry.status === 'DRAFT' && (
                              <button
                                onClick={() => setConfirmAction({ type: 'post', id: entry.id })}
                                className="text-xs text-green-700 hover:text-green-900 font-medium"
                              >
                                Valider
                              </button>
                            )}
                            {entry.status === 'POSTED' && (
                              <button
                                onClick={() => setConfirmAction({ type: 'cancel', id: entry.id })}
                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                              >
                                Annuler
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50">
                          <td colSpan={9} className="px-8 py-3">
                            <table className="min-w-full text-xs">
                              <thead>
                                <tr className="text-slate-500">
                                  <th className="text-left py-1 pr-4">N° Compte</th>
                                  <th className="text-left py-1 pr-4">Intitulé</th>
                                  <th className="text-right py-1 pr-4">Débit</th>
                                  <th className="text-right py-1">Crédit</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {entry.lines.map((line) => (
                                  <tr key={line.id}>
                                    <td className="py-1 pr-4 font-mono">{line.account?.accountNumber ?? '—'}</td>
                                    <td className="py-1 pr-4">{line.label}</td>
                                    <td className="py-1 pr-4 text-right">{Number(line.debit) > 0 ? fmt(Number(line.debit)) : '—'}</td>
                                    <td className="py-1 text-right">{Number(line.credit) > 0 ? fmt(Number(line.credit)) : '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && entries.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 text-xs text-slate-500 border-t">{entries.length} écriture(s)</div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">
              {confirmAction.type === 'post' ? 'Valider l\'écriture ?' : 'Annuler l\'écriture ?'}
            </h3>
            <p className="text-sm text-slate-600">
              {confirmAction.type === 'post'
                ? 'L\'écriture sera définitivement validée et ne pourra plus être modifiée.'
                : 'Une contre-passation sera créée. L\'opération ne peut pas être annulée.'}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Retour</button>
              <button
                onClick={() => confirmAction.type === 'post'
                  ? postMutation.mutate(confirmAction.id)
                  : cancelMutation.mutate(confirmAction.id)
                }
                disabled={postMutation.isPending || cancelMutation.isPending}
                className={`px-4 py-2 text-sm font-semibold rounded-md text-white transition-colors disabled:opacity-50 ${
                  confirmAction.type === 'post' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {postMutation.isPending || cancelMutation.isPending ? 'En cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Entry Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Nouvelle écriture comptable</h3>
              <button onClick={() => { setIsCreateModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="px-6 py-4 overflow-y-auto space-y-4">
              {/* Header fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.entryDate}
                    onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Journal *</label>
                  <select
                    value={form.journalId}
                    onChange={(e) => setForm((f) => ({ ...f, journalId: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                  >
                    <option value="">Sélectionner...</option>
                    {journals.map((j) => <option key={j.id} value={j.id}>{j.code} – {j.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Exercice fiscal *</label>
                  <select
                    value={form.fiscalYearId}
                    onChange={(e) => setForm((f) => ({ ...f, fiscalYearId: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                  >
                    <option value="">Sélectionner...</option>
                    {fiscalPeriods.filter((p) => p.status === 'OPEN').map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Libellé de l'écriture"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                  />
                </div>
              </div>

              {/* Lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Lignes d'écriture</label>
                  <button onClick={addLine} className="text-xs text-[#6b8f00] font-semibold hover:underline">+ Ajouter une ligne</button>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">Compte</th>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">Libellé</th>
                        <th className="px-3 py-2 text-right text-xs text-slate-500">Débit</th>
                        <th className="px-3 py-2 text-right text-xs text-slate-500">Crédit</th>
                        <th className="px-3 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form.lines.map((line, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-1.5">
                            <select
                              value={line.accountId}
                              onChange={(e) => updateLine(idx, 'accountId', e.target.value)}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#c6e911]"
                            >
                              <option value="">—</option>
                              {accounts.filter((a) => a.isActive).map((a) => (
                                <option key={a.id} value={a.id}>{a.accountNumber} – {a.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              value={line.label}
                              onChange={(e) => updateLine(idx, 'label', e.target.value)}
                              placeholder="Libellé"
                              className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#c6e911]"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min="0"
                              value={line.debit || ''}
                              onChange={(e) => updateLine(idx, 'debit', parseFloat(e.target.value) || 0)}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#c6e911]"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min="0"
                              value={line.credit || ''}
                              onChange={(e) => updateLine(idx, 'credit', parseFloat(e.target.value) || 0)}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#c6e911]"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            {form.lines.length > 2 && (
                              <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600 text-sm">&times;</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td colSpan={2} className="px-3 py-2 text-xs font-semibold text-slate-600 text-right">Totaux</td>
                        <td className={`px-3 py-2 text-xs font-bold text-right ${!isBalanced && totalDebit > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                          {fmt(totalDebit)}
                        </td>
                        <td className={`px-3 py-2 text-xs font-bold text-right ${!isBalanced && totalCredit > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                          {fmt(totalCredit)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {!isBalanced && totalDebit > 0 && (
                  <p className="text-xs text-red-600 mt-1">Le débit ({fmt(totalDebit)}) doit être égal au crédit ({fmt(totalCredit)}).</p>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => { setIsCreateModalOpen(false); resetForm(); }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || !isBalanced}
                className="px-4 py-2 text-sm bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#b5d500] transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Création...' : 'Créer en brouillon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntries;
