import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import {
  getAccounts, seedAccounting, createAccount, deactivateAccount,
  AccountingAccount, AccountType,
} from '../../services/apiAccounting/apiAccounting';

const TYPE_LABELS: Record<AccountType, string> = {
  ASSET: 'Actif',
  LIABILITY: 'Passif',
  EQUITY: 'Capitaux propres',
  REVENUE: 'Produits',
  EXPENSE: 'Charges',
  BALANCE: 'Bilan',
};

const TYPE_COLORS: Record<AccountType, string> = {
  ASSET: 'bg-blue-100 text-blue-800',
  LIABILITY: 'bg-red-100 text-red-800',
  EQUITY: 'bg-purple-100 text-purple-800',
  REVENUE: 'bg-green-100 text-green-800',
  EXPENSE: 'bg-orange-100 text-orange-800',
  BALANCE: 'bg-gray-100 text-gray-800',
};

const ChartOfAccounts: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<AccountType | ''>('');
  const [showInactive, setShowInactive] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({ accountNumber: '', label: '', type: 'ASSET' as AccountType });

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
      setIsAddModalOpen(false);
      setForm({ accountNumber: '', label: '', type: 'ASSET' });
    },
    onError: () => toast.error('Erreur lors de la création du compte.'),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAccount,
    onSuccess: () => {
      toast.success('Compte désactivé.');
      queryClient.invalidateQueries({ queryKey: ['accounting-accounts'] });
    },
    onError: () => toast.error('Erreur lors de la désactivation.'),
  });

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      if (!showInactive && !a.isActive) return false;
      if (search && !a.accountNumber.includes(search) && !a.label.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [accounts, search, showInactive]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Chercher un compte..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as AccountType | '')}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
          >
            <option value="">Tous les types</option>
            {(Object.keys(TYPE_LABELS) as AccountType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            Afficher inactifs
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="px-4 py-2 text-sm bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {seedMutation.isPending ? 'Initialisation...' : 'Initialiser SYSCOHADA'}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-sm bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#b5d500] transition-colors"
          >
            + Nouveau compte
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">N° Compte</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Intitulé</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Chargement...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Aucun compte trouvé. Cliquez sur "Initialiser SYSCOHADA" pour charger le plan comptable.
                  </td>
                </tr>
              ) : (
                filtered.map((account) => (
                  <tr key={account.id} className={`hover:bg-slate-50 transition-colors ${!account.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-800">{account.accountNumber}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{account.label}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[account.type]}`}>
                        {TYPE_LABELS[account.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${account.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        {account.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {account.isActive && (
                        <button
                          onClick={() => deactivateMutation.mutate(account.id)}
                          disabled={deactivateMutation.isPending}
                          className="text-xs text-red-600 hover:text-red-800 transition-colors"
                        >
                          Désactiver
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 text-xs text-slate-500 border-t">
            {filtered.length} compte(s) affiché(s)
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Nouveau compte comptable</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">N° de compte</label>
                <input
                  type="text"
                  value={form.accountNumber}
                  onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                  placeholder="Ex: 512000"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Intitulé</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Libellé du compte"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AccountType }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                >
                  {(Object.keys(TYPE_LABELS) as AccountType[]).map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.accountNumber || !form.label}
                className="px-4 py-2 text-sm bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#b5d500] transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;
