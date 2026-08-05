import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  getFixedAssets, createFixedAsset, FixedAssetCreationData,
} from '../../services/apiFinance/apiAssets';
import { getTreasuryAccounts } from '../../services/apiFinance/apiTreasury';
import { generateAnnualDepreciation, disposeFixedAsset } from '../../services/apiAccounting/apiImmobilisations';
import { FixedAsset } from '../../types';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';

const Immobilisations: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { subsidiary } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [disposeTarget, setDisposeTarget] = useState<FixedAsset | null>(null);
  const [disposeForm, setDisposeForm] = useState({ disposalDate: new Date().toISOString().slice(0, 10), disposalAmount: 0 });
  const [depreciationYear, setDepreciationYear] = useState(new Date().getFullYear());
  const [depreciationResult, setDepreciationResult] = useState<string | null>(null);

  const [form, setForm] = useState<FixedAssetCreationData>({
    fixedAssetsName: '',
    acquisitionDate: new Date().toISOString().slice(0, 10),
    acquisitionCost: 0,
    depreciationRate: 20,
    residualValue: 0,
    treasuryAccountId: '',
  });

  const { data: assets = [], isLoading } = useQuery<FixedAsset[]>({
    queryKey: ['fixed-assets'],
    queryFn: getFixedAssets,
  });

  const { data: treasuryAccounts = [] } = useQuery({
    queryKey: ['treasury-accounts', subsidiary?.id],
    queryFn: () => getTreasuryAccounts(subsidiary!.id),
    enabled: !!subsidiary?.id && isCreateModalOpen,
  });

  const createMutation = useMutation({
    mutationFn: createFixedAsset,
    onSuccess: () => {
      toast.success('Immobilisation créée avec succès.');
      queryClient.invalidateQueries({ queryKey: ['fixed-assets'] });
      setIsCreateModalOpen(false);
      setForm({ fixedAssetsName: '', acquisitionDate: new Date().toISOString().slice(0, 10), acquisitionCost: 0, depreciationRate: 20, residualValue: 0, treasuryAccountId: '' });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la création.'),
  });

  const depreciationMutation = useMutation({
    mutationFn: () => generateAnnualDepreciation(depreciationYear, subsidiary?.id),
    onSuccess: (res) => {
      const booked = res.assets.filter((a) => a.dotation > 0);
      setDepreciationResult(
        booked.length > 0
          ? `${booked.length} dotation(s) générée(s) pour un total de ${fmt(res.totalDotation)} FCFA.`
          : 'Aucune dotation à générer (déjà traité ou entièrement amorti).',
      );
      queryClient.invalidateQueries({ queryKey: ['fixed-assets'] });
      toast.success('Dotations aux amortissements générées.');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la génération des dotations.'),
  });

  const disposeMutation = useMutation({
    mutationFn: () => disposeFixedAsset(disposeTarget!.id, disposeForm),
    onSuccess: () => {
      toast.success('Immobilisation cédée avec succès.');
      queryClient.invalidateQueries({ queryKey: ['fixed-assets'] });
      setDisposeTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la cession.'),
  });

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n);

  const netBookValue = (asset: FixedAsset) => asset.acquisitionCost - asset.cumulativeAmortization;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium text-slate-700">Dotation annuelle :</label>
          <input
            type="number"
            value={depreciationYear}
            onChange={(e) => setDepreciationYear(parseInt(e.target.value, 10))}
            className="w-24 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
          />
          <button
            onClick={() => { setDepreciationResult(null); depreciationMutation.mutate(); }}
            disabled={depreciationMutation.isPending}
            className="px-4 py-2 text-sm bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {depreciationMutation.isPending ? 'Génération...' : 'Générer les dotations'}
          </button>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 text-sm bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#b5d500] transition-colors"
        >
          + Nouvelle immobilisation
        </button>
      </div>

      {depreciationResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
          {depreciationResult}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Désignation</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Acquisition</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Coût</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Taux</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Amort. cumulé</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">VNC</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableSkeleton rows={6} columns={8} />
              ) : assets.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon="finance" title="Aucune immobilisation." /></td></tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className={`hover:bg-slate-50 ${asset.status === 'DISPOSED' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{asset.fixedAssetsName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{new Date(asset.acquisitionDate).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-700">{fmt(asset.acquisitionCost)}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">{asset.depreciationRate}%</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">{fmt(asset.cumulativeAmortization)}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">{fmt(netBookValue(asset))}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${asset.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {asset.status === 'ACTIVE' ? 'Active' : 'Cédée'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {asset.status === 'ACTIVE' && (
                        <button
                          onClick={() => { setDisposeTarget(asset); setDisposeForm({ disposalDate: new Date().toISOString().slice(0, 10), disposalAmount: 0 }); }}
                          className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                        >
                          Céder
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Nouvelle immobilisation</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Désignation</label>
                <input
                  type="text"
                  value={form.fixedAssetsName}
                  onChange={(e) => setForm((f) => ({ ...f, fixedAssetsName: e.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date d'acquisition</label>
                  <input
                    type="date"
                    value={form.acquisitionDate}
                    onChange={(e) => setForm((f) => ({ ...f, acquisitionDate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Taux annuel (%)</label>
                  <input
                    type="number"
                    value={form.depreciationRate}
                    onChange={(e) => setForm((f) => ({ ...f, depreciationRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Coût d'acquisition</label>
                  <input
                    type="number"
                    value={form.acquisitionCost || ''}
                    onChange={(e) => setForm((f) => ({ ...f, acquisitionCost: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valeur résiduelle</label>
                  <input
                    type="number"
                    value={form.residualValue || ''}
                    onChange={(e) => setForm((f) => ({ ...f, residualValue: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Compte de trésorerie (paiement)</label>
                <select
                  value={form.treasuryAccountId}
                  onChange={(e) => setForm((f) => ({ ...f, treasuryAccountId: e.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                >
                  <option value="">Sélectionner...</option>
                  {treasuryAccounts.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Annuler</button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.fixedAssetsName || !form.acquisitionCost || !form.treasuryAccountId}
                className="px-4 py-2 text-sm bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#b5d500] transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispose Modal */}
      {disposeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Céder "{disposeTarget.fixedAssetsName}"</h3>
              <p className="text-xs text-slate-500 mt-1">
                Valeur nette comptable actuelle : {fmt(netBookValue(disposeTarget))} FCFA
              </p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date de cession</label>
                <input
                  type="date"
                  value={disposeForm.disposalDate}
                  onChange={(e) => setDisposeForm((f) => ({ ...f, disposalDate: e.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Montant de cession (0 si mise au rebut)</label>
                <input
                  type="number"
                  min="0"
                  value={disposeForm.disposalAmount || ''}
                  onChange={(e) => setDisposeForm((f) => ({ ...f, disposalAmount: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setDisposeTarget(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Annuler</button>
              <button
                onClick={() => disposeMutation.mutate()}
                disabled={disposeMutation.isPending}
                className="px-4 py-2 text-sm bg-orange-600 text-white font-semibold rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {disposeMutation.isPending ? 'Cession...' : 'Confirmer la cession'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Immobilisations;
