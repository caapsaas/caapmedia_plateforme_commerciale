import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import { getFiscalPeriods, closeFiscalPeriod, FiscalPeriod, FiscalPeriodStatus } from '../../services/apiAccounting/apiAccounting';

const STATUS_LABELS: Record<FiscalPeriodStatus, string> = {
  OPEN: 'Ouvert',
  CLOSED: 'Clôturé',
};

const STATUS_COLORS: Record<FiscalPeriodStatus, string> = {
  OPEN: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-slate-100 text-slate-600',
};

const FiscalPeriods: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmClose, setConfirmClose] = useState<FiscalPeriod | null>(null);

  const { data: periods = [], isLoading } = useQuery<FiscalPeriod[]>({
    queryKey: ['accounting-periods'],
    queryFn: getFiscalPeriods,
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => closeFiscalPeriod(id),
    onSuccess: () => {
      toast.success('Exercice fiscal clôturé avec succès.');
      queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
      setConfirmClose(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la clôture.'),
  });

  const fmt = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        <strong>Note :</strong> L'exercice fiscal courant est créé automatiquement lors de la première opération comptable.
        La clôture d'un exercice est irréversible et nécessite que toutes les écritures soient validées.
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Exercice</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Début</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fin</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Créé le</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Chargement...</td></tr>
              ) : periods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Aucun exercice fiscal. L'exercice courant sera créé automatiquement lors de la première journalisation.
                  </td>
                </tr>
              ) : (
                periods.map((period) => (
                  <tr key={period.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{period.label}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{fmt(period.startDate)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{fmt(period.endDate)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[period.status]}`}>
                        {STATUS_LABELS[period.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{fmt(period.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {period.status === 'OPEN' && (
                        <button
                          onClick={() => setConfirmClose(period)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
                        >
                          Clôturer
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

      {/* Confirm Close Modal */}
      {confirmClose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Clôturer l'exercice {confirmClose.label} ?</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Cette action est <strong>irréversible</strong>. Toutes les écritures en brouillon doivent être validées ou supprimées avant la clôture.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmClose(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => closeMutation.mutate(confirmClose.id)}
                disabled={closeMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {closeMutation.isPending ? 'Clôture...' : 'Confirmer la clôture'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiscalPeriods;
