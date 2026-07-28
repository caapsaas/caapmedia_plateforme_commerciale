import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Search, Pencil, Printer, Download, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useCanModifyAccounting } from '../../hooks/useCanModifyAccounting';
import {
  getAccounts, seedAccounting, createAccount, updateAccount, deactivateAccount,
  AccountingAccount, AccountingAccountType, CreateAccountDto,
} from '../../services/apiAccounting/apiAccounts';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import AsyncButton from '../ui/AsyncButton';
import ConfirmationModal from '../common/ConfirmationModal';
import DocumentHeader from '../common/DocumentHeader';
import { printElementAsPdf } from '../../utils/pdfExporter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TYPE_LABELS: Record<AccountingAccountType, string> = {
  ASSET: 'Actif',
  LIABILITY: 'Passif',
  EQUITY: 'Capitaux propres',
  REVENUE: 'Produits',
  EXPENSE: 'Charges',
};

const TYPE_COLORS: Record<AccountingAccountType, string> = {
  ASSET: 'bg-blue-100 text-blue-800',
  LIABILITY: 'bg-red-100 text-red-800',
  EQUITY: 'bg-purple-100 text-purple-800',
  REVENUE: 'bg-green-100 text-green-800',
  EXPENSE: 'bg-orange-100 text-orange-800',
};

const CLASS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const ChartOfAccounts: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { subsidiary } = useAuth();
  const canModify = useCanModifyAccounting();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<AccountingAccountType | ''>('');
  const [showInactive, setShowInactive] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountingAccount | null>(null);
  const [form, setForm] = useState({ accountNumber: '', accountName: '', accountType: 'ASSET' as AccountingAccountType, class: 1 });
  const [deactivateTarget, setDeactivateTarget] = useState<AccountingAccount | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (accountToEdit) {
      setForm({
        accountNumber: accountToEdit.accountNumber,
        accountName: accountToEdit.accountName,
        accountType: accountToEdit.accountType,
        class: accountToEdit.class ?? 1,
      });
    } else {
      setForm({ accountNumber: '', accountName: '', accountType: 'ASSET', class: 1 });
    }
  }, [accountToEdit, isAccountModalOpen]);

  const { data: accounts = [], isLoading } = useQuery<AccountingAccount[]>({
    queryKey: ['accounting-accounts', filterType],
    queryFn: () => getAccounts(filterType || undefined),
  });

  const seedMutation = useMutation({
    mutationFn: seedAccounting,
    onSuccess: (res) => {
      toast.success(res.message || 'Plan comptable SYSCOHADA initialisé.');
      queryClient.invalidateQueries({ queryKey: ['accounting-accounts'] });
    },
    onError: () => toast.error('Erreur lors de l\'initialisation.'),
  });

  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      toast.success('Compte créé avec succès.');
      queryClient.invalidateQueries({ queryKey: ['accounting-accounts'] });
      setIsAccountModalOpen(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la création du compte.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAccountDto> }) => updateAccount(id, data),
    onSuccess: () => {
      toast.success('Compte mis à jour.');
      queryClient.invalidateQueries({ queryKey: ['accounting-accounts'] });
      setIsAccountModalOpen(false);
      setAccountToEdit(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la mise à jour.'),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAccount,
    onSuccess: () => {
      toast.success('Compte désactivé.');
      queryClient.invalidateQueries({ queryKey: ['accounting-accounts'] });
      setDeactivateTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la désactivation.'),
  });

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      if (!showInactive && !a.isActive) return false;
      if (search && !a.accountNumber.includes(search) && !a.accountName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [accounts, search, showInactive]);

  const handleNewAccount = () => {
    setAccountToEdit(null);
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (account: AccountingAccount) => {
    setAccountToEdit(account);
    setIsAccountModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountToEdit) {
      updateMutation.mutate({ id: accountToEdit.id, data: form });
    } else {
      createMutation.mutate(form);
    }
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
      doc.text('Plan comptable', 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Référentiel SYSCOHADA révisé — Imprimé le ${new Date().toLocaleDateString('fr-FR')}`, 14, 21);

      autoTable(doc, {
        startY: 27,
        head: [['Code', 'Intitulé', 'Type', 'Classe', 'Statut']],
        body: filtered.map((a) => [a.accountNumber, a.accountName, TYPE_LABELS[a.accountType], String(a.class ?? '—'), a.isActive ? 'Actif' : 'Inactif']),
        theme: 'striped',
        headStyles: { fillColor: [198, 233, 17], textColor: [0, 0, 0], fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
        didParseCell: (data) => {
          if (data.column.index === 4 && data.section === 'body') {
            data.cell.styles.textColor = data.cell.raw === 'Actif' ? [22, 163, 74] : [220, 38, 38];
          }
        },
      });

      doc.save('Plan_Comptable_SYSCOHADA.pdf');
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la génération du PDF.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Plan comptable</h3>
          <p className="text-sm text-slate-500">Référentiel des comptes SYSCOHADA révisé 2017.</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          {canModify && (
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${seedMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{seedMutation.isPending ? 'Initialisation...' : 'Initialiser SYSCOHADA'}</span>
            </button>
          )}
          <button onClick={handlePrint} disabled={isPrinting} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed" title="Imprimer">
            <Printer className="w-5 h-5" />
          </button>
          <button onClick={handleExportPDF} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Exporter en PDF">
            <Download className="w-5 h-5" />
          </button>
          {canModify && (
            <button
              onClick={handleNewAccount}
              className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 font-semibold rounded-lg hover:bg-[#b5d500] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau compte</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Chercher un compte..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as AccountingAccountType | '')}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
        >
          <option value="">Tous les types</option>
          {(Object.keys(TYPE_LABELS) as AccountingAccountType[]).map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded" />
          Afficher inactifs
        </label>
      </div>

      {/* Accounts table */}
      <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">N° Compte</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Intitulé</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Classe</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableSkeleton rows={10} columns={6} />
            ) : filtered.length > 0 ? (
              filtered.map((account) => (
                <tr key={account.id} className={`hover:bg-slate-50/50 transition-colors ${!account.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 font-mono font-bold text-slate-700">{account.accountNumber}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{account.accountName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${TYPE_COLORS[account.accountType]}`}>
                      {TYPE_LABELS[account.accountType]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{account.class ?? '—'}</td>
                  <td className="px-6 py-4">
                    <AsyncButton
                      onClick={() => {
                        if (account.isActive) setDeactivateTarget(account);
                        return Promise.resolve();
                      }}
                      disabled={!canModify || !account.isActive}
                      showSpinner={false}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${account.isActive ? 'bg-emerald-500' : 'bg-slate-300'} ${!canModify ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${account.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </AsyncButton>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => canModify && handleEditAccount(account)}
                      disabled={!canModify}
                      className={`p-1 hover:text-[#6b8f00] transition-colors ${!canModify ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon="document" title="Aucun compte trouvé" description="Cliquez sur « Initialiser SYSCOHADA » pour charger le plan comptable." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">{accountToEdit ? 'Modifier le compte' : 'Nouveau compte comptable'}</h2>
              <button onClick={() => setIsAccountModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">N° de compte</label>
                <input
                  type="text" required value={form.accountNumber}
                  onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                  placeholder="Ex: 512000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Intitulé</label>
                <input
                  type="text" required value={form.accountName}
                  onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                  placeholder="Libellé du compte"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    required value={form.accountType}
                    onChange={(e) => setForm((f) => ({ ...f, accountType: e.target.value as AccountingAccountType }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-transparent outline-none"
                  >
                    {(Object.keys(TYPE_LABELS) as AccountingAccountType[]).map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Classe</label>
                  <select
                    required value={form.class}
                    onChange={(e) => setForm((f) => ({ ...f, class: parseInt(e.target.value, 10) }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-transparent outline-none"
                  >
                    {CLASS_OPTIONS.map((c) => <option key={c} value={c}>Classe {c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsAccountModalOpen(false)} className="px-6 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2.5 bg-[#c6e911] text-slate-800 rounded-lg hover:bg-[#b5d500] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}
        title={deactivateTarget ? `Désactiver le compte ${deactivateTarget.accountNumber} ?` : ''}
        message="Ce compte ne pourra plus être utilisé dans de nouvelles écritures."
        confirmButtonText={deactivateMutation.isPending ? 'Désactivation...' : 'Désactiver'}
        isDangerous
      />

      {/* Hidden print template */}
      {subsidiary && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '1000px', zIndex: -1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
          <div ref={printRef} className="p-10 bg-white" style={{ width: '1000px' }}>
            <DocumentHeader subsidiary={subsidiary} showContactIcons={false} />
            <h2 className="text-xl font-bold text-slate-800 mb-1">Plan comptable — SYSCOHADA révisé 2017</h2>
            <p className="text-xs text-slate-500 mb-4">Imprimé le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-2 py-1.5 text-left">Code</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-left">Intitulé</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-center">Type</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-center">Classe</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a, idx) => (
                  <tr key={a.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa', opacity: a.isActive ? 1 : 0.5 }}>
                    <td className="border border-slate-300 px-2 py-1 font-mono font-bold">{a.accountNumber}</td>
                    <td className="border border-slate-300 px-2 py-1">{a.accountName}</td>
                    <td className="border border-slate-300 px-2 py-1 text-center">{TYPE_LABELS[a.accountType]}</td>
                    <td className="border border-slate-300 px-2 py-1 text-center">{a.class ?? '—'}</td>
                    <td className="border border-slate-300 px-2 py-1 text-center" style={{ color: a.isActive ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                      {a.isActive ? 'Actif' : 'Inactif'}
                    </td>
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

export default ChartOfAccounts;
