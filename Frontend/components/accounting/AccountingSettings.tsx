import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Building2, Calendar, DollarSign, Lock, Plus, Receipt, RefreshCw, Unlock, Users, Wallet, X,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useCanModifyAccounting } from '../../hooks/useCanModifyAccounting';
import { getMappings, updateMapping, seedMappings, AccountMapping } from '../../services/apiAccounting/apiMappings';
import { getJournals, seedJournals, AccountingJournal } from '../../services/apiAccounting/apiJournals';
import { getAccounts, AccountingAccount } from '../../services/apiAccounting/apiAccounts';
import {
  getFiscalYears, createFiscalYear, closeFiscalYear, reopenFiscalYear,
  FiscalYear, CreateFiscalYearDto,
} from '../../services/apiAccounting/apiPeriods';
import ConfirmationModal from '../common/ConfirmationModal';

interface AccountingSettingsProps {
  fiscalPeriods: FiscalYear[];
}

const MAPPING_GROUPS: { label: string; icon: React.ReactNode; keys: string[] }[] = [
  { label: 'Ventes', icon: <Receipt className="w-4 h-4" />, keys: ['SALES_CLIENT', 'SALES_CLIENT_DIVERSE', 'SALES_REVENUE', 'VENDOR_ACCOUNT', 'VENDOR_MARGIN_REVENUE', 'TVA_COLLECTEE'] },
  { label: 'Achats', icon: <BookOpen className="w-4 h-4" />, keys: ['PURCHASE_SUPPLIER', 'PURCHASE_EXPENSE', 'PURCHASE_COST', 'TVA_DEDUCTIBLE_ACHAT', 'STOCK_VARIATION'] },
  { label: 'Trésorerie', icon: <Wallet className="w-4 h-4" />, keys: ['CASH_ACCOUNT', 'SAFE_ACCOUNT', 'EXPENSE_BOX_ACCOUNT', 'BANK_ACCOUNT', 'OPENING_BALANCE', 'BANK_WITHDRAWAL', 'CASH_REFILL'] },
  { label: 'Fiscalité', icon: <DollarSign className="w-4 h-4" />, keys: ['TVA_RETENUE_ACHAT', 'BIC_COLLECTEE'] },
  { label: 'Paie', icon: <Users className="w-4 h-4" />, keys: ['PAYROLL_EXPENSE', 'PAYROLL_BONUS_EXPENSE', 'PAYROLL_CHARGES_EXPENSE', 'PAYROLL_TPA_EXPENSE', 'PAYROLL_NET_PAYABLE', 'PAYROLL_CNSS_LIABILITY', 'PAYROLL_IUTS_LIABILITY', 'PAYROLL_TPA_LIABILITY', 'PAYROLL_ROSALAIRE_LIABILITY', 'PAYROLL_ADVANCES'] },
  { label: 'Dépenses', icon: <Building2 className="w-4 h-4" />, keys: ['SUPPLIER_PAYMENT', 'TAX_PAYMENT', 'TAXES_EXPENSE', 'HAO_EXPENSE', 'RENT_EXPENSE', 'UTILITIES_EXPENSE', 'MARKETING_EXPENSE', 'SUPPLIES_EXPENSE', 'NEED_EXPRESSION_EXPENSE', 'SALARIES_EXPENSE', 'TRANSPORT_EXPENSE', 'TRANSPORT_CLIENT_DELIVERY_EXPENSE', 'TRANSPORT_SUPPLIER_PICKUP_EXPENSE', 'OTHER_EXPENSE'] },
  { label: 'Immobilisations', icon: <Calendar className="w-4 h-4" />, keys: ['FIXED_ASSET', 'AMORTIZATION_EXPENSE', 'AMORTIZATION_ACCOUNT', 'DISPOSAL_RECEIVABLE', 'DISPOSAL_PROCEEDS', 'DISPOSAL_NBV_CHARGE'] },
  { label: 'Dettes long terme', icon: <DollarSign className="w-4 h-4" />, keys: ['LONG_TERM_DEBT'] },
];

// Traduction des clés de mapping — décrit l'action métier journalisée par chaque
// clé, affichée à la place du nom de clé brut dans la liste des mappings.
const MAPPING_KEY_LABELS: Record<string, string> = {
  // --- VENTES ---
  SALES_CLIENT: 'Enregistrement des créances clients lors des ventes',
  SALES_CLIENT_DIVERSE: 'Enregistrement des créances diverses clients',
  SALES_REVENUE: "Enregistrement du chiffre d'affaires sur ventes",
  VENDOR_ACCOUNT: 'Opérations sur compte vendeur',
  VENDOR_MARGIN_REVENUE: 'Enregistrement de la marge vendeur (produits accessoires)',
  TVA_COLLECTEE: 'Calcul de la TVA collectée sur ventes',

  // --- ACHATS ---
  PURCHASE_SUPPLIER: 'Enregistrement des dettes fournisseurs sur achats',
  PURCHASE_EXPENSE: 'Enregistrement des achats de marchandises',
  PURCHASE_COST: 'Enregistrement des achats importés',
  TVA_DEDUCTIBLE_ACHAT: 'Récupération de la TVA déductible sur achats',
  STOCK_VARIATION: 'Sortie de stock sur ventes (variation de stock)',

  // --- TRÉSORERIE ---
  CASH_ACCOUNT: 'Opérations sur caisse principale',
  SAFE_ACCOUNT: 'Opérations sur coffre-fort',
  EXPENSE_BOX_ACCOUNT: 'Opérations sur caisse de dépense',
  BANK_ACCOUNT: 'Opérations sur compte bancaire',
  OPENING_BALANCE: "Report à nouveau (solde d'ouverture)",
  BANK_WITHDRAWAL: "Transfert d'argent du coffre-fort vers la banque",
  CASH_REFILL: 'Approvisionnement de la caisse depuis le coffre-fort',

  // --- FISCALITÉ ---
  TVA_RETENUE_ACHAT: 'Retenue de la TVA à la source sur achats',
  BIC_COLLECTEE: 'Calcul du BIC collecté sur ventes',

  // --- PAIE ---
  PAYROLL_EXPENSE: 'Enregistrement des salaires bruts lors de la paie',
  PAYROLL_BONUS_EXPENSE: 'Enregistrement des primes et gratifications de paie',
  PAYROLL_CHARGES_EXPENSE: 'Enregistrement des charges sociales patronales',
  PAYROLL_TPA_EXPENSE: 'Enregistrement de la TPA (taxe sur salaires)',
  PAYROLL_NET_PAYABLE: 'Calcul du net à payer aux salariés',
  PAYROLL_CNSS_LIABILITY: 'Calcul des cotisations CNSS à verser',
  PAYROLL_IUTS_LIABILITY: "Calcul de l'IUTS (impôt sur salaires) à verser",
  PAYROLL_TPA_LIABILITY: 'Calcul de la TPA à verser',
  PAYROLL_ROSALAIRE_LIABILITY: 'Calcul du Rosalaire à verser',
  PAYROLL_ADVANCES: 'Récupération des avances et acomptes sur salaires',

  // --- DÉPENSES & PAIEMENTS ---
  SUPPLIER_PAYMENT: 'Paiement des dettes fournisseurs',
  TAX_PAYMENT: 'Paiement des impôts et taxes',
  TAXES_EXPENSE: 'Enregistrement des impôts et taxes (patente)',
  HAO_EXPENSE: "Enregistrement des charges hors activité ordinaire",
  RENT_EXPENSE: 'Enregistrement des loyers (location de locaux)',
  UTILITIES_EXPENSE: 'Enregistrement des factures (eau, électricité, internet)',
  MARKETING_EXPENSE: 'Enregistrement des frais de marketing et publicité',
  SUPPLIES_EXPENSE: 'Enregistrement des fournitures de bureau',
  NEED_EXPRESSION_EXPENSE: "Enregistrement des expressions de besoin",
  SALARIES_EXPENSE: 'Enregistrement des salaires (dépense de trésorerie manuelle)',
  TRANSPORT_EXPENSE: 'Enregistrement des frais de transport (dépense de trésorerie manuelle)',
  TRANSPORT_CLIENT_DELIVERY_EXPENSE: 'Enregistrement des frais de livraison client',
  TRANSPORT_SUPPLIER_PICKUP_EXPENSE: 'Enregistrement des frais de collecte fournisseur',
  OTHER_EXPENSE: 'Enregistrement des autres charges externes',

  // --- IMMOBILISATIONS ---
  FIXED_ASSET: "Enregistrement de l'acquisition d'une immobilisation",
  AMORTIZATION_EXPENSE: 'Enregistrement de la dotation aux amortissements',
  AMORTIZATION_ACCOUNT: 'Cumul des amortissements sur immobilisations',
  DISPOSAL_RECEIVABLE: "Créance sur cession d'immobilisation",
  DISPOSAL_PROCEEDS: "Produit de cession d'immobilisation",
  DISPOSAL_NBV_CHARGE: "Valeur nette comptable sortie lors d'une cession",

  // --- DETTES LONG TERME ---
  LONG_TERM_DEBT: "Réception ou remboursement d'un emprunt à long terme",
};

const translateMappingKey = (key: string): string => MAPPING_KEY_LABELS[key] ?? key;

const JOURNAL_TYPE_LABELS: Record<string, string> = {
  VENTES: 'Ventes',
  ACHATS: 'Achats',
  BANQUE: 'Banque',
  CAISSE: 'Caisse',
  OD: 'Opérations diverses',
};

const MappingsTab: React.FC<{ canModify: boolean }> = ({ canModify }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const { data: mappings = [], isLoading } = useQuery<AccountMapping[]>({
    queryKey: ['accounting-mappings'],
    queryFn: getMappings,
  });

  const { data: accounts = [] } = useQuery<AccountingAccount[]>({
    queryKey: ['accounting-accounts'],
    queryFn: () => getAccounts(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, accountCode }: { key: string; accountCode: string }) => updateMapping(key, accountCode),
    onSuccess: () => {
      toast.success('Mapping mis à jour.');
      queryClient.invalidateQueries({ queryKey: ['accounting-mappings'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la mise à jour — vérifiez que le compte existe et est actif.'),
  });

  const seedMutation = useMutation({
    mutationFn: seedMappings,
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['accounting-mappings'] });
      setIsSeeding(false);
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Erreur lors de l'import des mappings.");
      setIsSeeding(false);
    },
  });

  const handleSeed = () => {
    setIsSeeding(true);
    seedMutation.mutate();
  };

  const byKey = new Map(mappings.map((m) => [m.key, m]));
  const activeAccounts = accounts.filter((a) => a.isActive);

  if (isLoading) return <div className="py-8 text-center text-slate-500 text-sm">Chargement...</div>;

  return (
    <div className="space-y-4">
      {canModify && (
        <div className="flex justify-end">
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 font-semibold rounded-lg hover:bg-[#b5d500] transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Import en cours...' : 'Importer mapping par défaut'}</span>
          </button>
        </div>
      )}

      {mappings.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm">
          Aucun mapping configuré — cliquez sur « Importer mapping par défaut » ci-dessus (le plan comptable doit être initialisé d'abord, onglet Plan comptable).
        </div>
      ) : (
        MAPPING_GROUPS.map((group) => {
          const rows = group.keys.filter((k) => byKey.has(k));
          if (rows.length === 0) return null;
          return (
            <div key={group.label} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <span className="text-slate-400">{group.icon}</span>
                <h4 className="text-xs font-semibold text-slate-500 uppercase">{group.label}</h4>
              </div>
              <table className="min-w-full divide-y divide-slate-100">
                <tbody>
                  {rows.map((key) => {
                    const mapping = byKey.get(key)!;
                    return (
                      <tr key={key} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5">
                          <p className="text-sm text-slate-700">{translateMappingKey(key)}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{key}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right w-64">
                          <select
                            value={mapping.accountCode}
                            onChange={(e) => canModify && updateMutation.mutate({ key, accountCode: e.target.value })}
                            disabled={!canModify || updateMutation.isPending}
                            className={`w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#c6e911] ${!canModify ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                          >
                            <option value={mapping.accountCode}>{mapping.accountCode}</option>
                            {activeAccounts.filter((a) => a.accountNumber !== mapping.accountCode).map((a) => (
                              <option key={a.id} value={a.accountNumber}>{a.accountNumber} — {a.accountName}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
};

const JournalsTab: React.FC<{ canModify: boolean }> = ({ canModify }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const { data: journals = [], isLoading } = useQuery<AccountingJournal[]>({
    queryKey: ['accounting-journals'],
    queryFn: getJournals,
  });

  const seedMutation = useMutation({
    mutationFn: seedJournals,
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['accounting-journals'] });
      setIsSeeding(false);
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Erreur lors de l'import des journaux.");
      setIsSeeding(false);
    },
  });

  const handleSeed = () => {
    setIsSeeding(true);
    seedMutation.mutate();
  };

  if (isLoading) return <div className="py-8 text-center text-slate-500 text-sm">Chargement...</div>;

  return (
    <div className="space-y-4">
      {canModify && (
        <div className="flex justify-end">
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 font-semibold rounded-lg hover:bg-[#b5d500] transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Import en cours...' : 'Importer journaux par défaut'}</span>
          </button>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Code</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nom</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {journals.map((j) => (
            <tr key={j.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-sm font-mono font-bold text-slate-800">{j.code}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{j.name}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{JOURNAL_TYPE_LABELS[j.journalType] ?? j.journalType}</td>
              <td className="px-4 py-3 text-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${j.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                  {j.isActive ? 'Actif' : 'Inactif'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {journals.length === 0 && (
        <div className="py-8 text-center text-slate-400 text-sm">
          Aucun journal — cliquez sur « Importer journaux par défaut » ci-dessus.
        </div>
      )}
      </div>
    </div>
  );
};

const PeriodsTab: React.FC<{ periods: FiscalYear[]; canModify: boolean }> = ({ periods, canModify }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmClose, setConfirmClose] = useState<FiscalYear | null>(null);
  const [confirmReopen, setConfirmReopen] = useState<FiscalYear | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState<CreateFiscalYearDto>({ name: '', startDate: '', endDate: '' });

  const createMutation = useMutation({
    mutationFn: createFiscalYear,
    onSuccess: () => {
      toast.success('Exercice fiscal créé avec succès.');
      queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
      setIsCreateModalOpen(false);
      setForm({ name: '', startDate: '', endDate: '' });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la création.'),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => closeFiscalYear(id),
    onSuccess: () => {
      toast.success('Exercice fiscal clôturé avec succès.');
      queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
      setConfirmClose(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la clôture.'),
  });

  const reopenMutation = useMutation({
    mutationFn: (id: string) => reopenFiscalYear(id),
    onSuccess: () => {
      toast.success('Exercice fiscal réouvert.');
      queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
      setConfirmReopen(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la réouverture.'),
  });

  const fmt = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">L'exercice fiscal courant est créé automatiquement lors de la première opération comptable.</p>
        {canModify && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 font-semibold rounded-lg hover:bg-[#b5d500] transition-colors text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel exercice</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <p className="text-sm text-slate-600">Liste des exercices fiscaux</p>
        </div>
        <div className="p-4 space-y-2">
          {periods.length > 0 ? (
            periods.map((period) => (
              <div key={period.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${period.isClosed ? 'bg-red-100' : 'bg-green-100'}`}>
                    {period.isClosed ? <Lock className="w-5 h-5 text-red-600" /> : <Unlock className="w-5 h-5 text-green-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">{period.name}</p>
                    <p className="text-xs text-slate-500">Du {fmt(period.startDate)} au {fmt(period.endDate)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${period.isClosed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {period.isClosed ? 'Clôturé' : 'Ouvert'}
                  </span>
                  {canModify && (period.isClosed ? (
                    <button
                      onClick={() => setConfirmReopen(period)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-semibold"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Réouvrir</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmClose(period)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-semibold"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Clôturer</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Calendar className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">Aucun exercice fiscal</p>
              <p className="text-xs">Sera créé automatiquement lors de la première journalisation.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!confirmClose}
        onClose={() => setConfirmClose(null)}
        onConfirm={() => confirmClose && closeMutation.mutate(confirmClose.id)}
        title={confirmClose ? `Clôturer l'exercice ${confirmClose.name} ?` : ''}
        message="Toutes les écritures en brouillon doivent être validées ou supprimées avant la clôture."
        confirmButtonText={closeMutation.isPending ? 'Clôture...' : 'Confirmer la clôture'}
        isDangerous
      />
      <ConfirmationModal
        isOpen={!!confirmReopen}
        onClose={() => setConfirmReopen(null)}
        onConfirm={() => confirmReopen && reopenMutation.mutate(confirmReopen.id)}
        title={confirmReopen ? `Réouvrir l'exercice ${confirmReopen.name} ?` : ''}
        message="Nécessaire pour rattacher une correction (extourne) après la clôture. L'exercice redevient modifiable."
        confirmButtonText={reopenMutation.isPending ? 'Réouverture...' : 'Confirmer la réouverture'}
      />

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Nouvel exercice fiscal</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom</label>
                <input
                  type="text" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Exercice 2026"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date de début</label>
                <input
                  type="date" value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date de fin</label>
                <input
                  type="date" value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Annuler</button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.name || !form.startDate || !form.endDate}
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

const AccountingSettings: React.FC<AccountingSettingsProps> = ({ fiscalPeriods }) => {
  const canModify = useCanModifyAccounting();
  const [activeTab, setActiveTab] = useState<'mappings' | 'journals' | 'periods'>('mappings');

  const { data: livePeriods = fiscalPeriods } = useQuery<FiscalYear[]>({
    queryKey: ['accounting-periods'],
    queryFn: getFiscalYears,
    initialData: fiscalPeriods,
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">Paramètres comptables</h3>
        <p className="text-sm text-slate-500">Mappings, journaux et exercices fiscaux.</p>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('mappings')}
          className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === 'mappings' ? 'text-[#6b8f00] border-b-2 border-[#c6e911]' : 'text-slate-600 hover:text-slate-800'}`}
        >
          Mappings comptables
        </button>
        <button
          onClick={() => setActiveTab('journals')}
          className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === 'journals' ? 'text-[#6b8f00] border-b-2 border-[#c6e911]' : 'text-slate-600 hover:text-slate-800'}`}
        >
          Journaux
        </button>
        <button
          onClick={() => setActiveTab('periods')}
          className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === 'periods' ? 'text-[#6b8f00] border-b-2 border-[#c6e911]' : 'text-slate-600 hover:text-slate-800'}`}
        >
          Exercices fiscaux
        </button>
        {!canModify && (
          <div className="flex-1" />
        )}
      </div>

      {activeTab === 'mappings' && <MappingsTab canModify={canModify} />}
      {activeTab === 'journals' && <JournalsTab canModify={canModify} />}
      {activeTab === 'periods' && <PeriodsTab periods={livePeriods} canModify={canModify} />}

      {!canModify && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <RefreshCw className="w-3.5 h-3.5" />
          Lecture seule — réservé aux administrateurs et directeurs financiers du siège.
        </div>
      )}
    </div>
  );
};

export default AccountingSettings;
