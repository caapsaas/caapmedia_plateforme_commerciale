import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle2, Clock, ShieldCheck, XCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import {
  getAccessRequests, approveAccessRequest, rejectAccessRequest,
  AccountingAccessRequest, AccountingAccessStatus,
} from '../services/apiAccounting/apiAccountingAccess';

const STATUS_LABELS: Record<AccountingAccessStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
};

const STATUS_COLORS: Record<AccountingAccessStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const AccountingAccessAdmin: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [approveTarget, setApproveTarget] = useState<AccountingAccessRequest | null>(null);
  const [approveForm, setApproveForm] = useState<{ duration: number; unit: 'HOURS' | 'DAYS' }>({ duration: 8, unit: 'HOURS' });
  const [rejectTarget, setRejectTarget] = useState<AccountingAccessRequest | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  const { data: requests = [], isLoading } = useQuery<AccountingAccessRequest[]>({
    queryKey: ['accounting-access-requests'],
    queryFn: getAccessRequests,
  });

  const approveMutation = useMutation({
    mutationFn: () => approveAccessRequest(approveTarget!.id, approveForm.duration, approveForm.unit),
    onSuccess: () => {
      toast.success('Accès approuvé.');
      queryClient.invalidateQueries({ queryKey: ['accounting-access-requests'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-access-pending-count'] });
      setApproveTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Erreur lors de l'approbation."),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectAccessRequest(rejectTarget!.id, rejectionNote || undefined),
    onSuccess: () => {
      toast.success('Demande refusée.');
      queryClient.invalidateQueries({ queryKey: ['accounting-access-requests'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-access-pending-count'] });
      setRejectTarget(null);
      setRejectionNote('');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors du refus.'),
  });

  const fmtDate = (s: string) => new Date(s).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

  const pending = requests.filter((r) => r.status === 'PENDING');
  const processed = requests.filter((r) => r.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-400 tracking-widest uppercase">Contrôle d'accès · Comptabilité</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Demandes d'accès comptabilité</h2>
        <p className="text-sm text-slate-500 mt-1">Accès temporaire (JIT) au module comptabilité — réservé aux administrateurs du siège.</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500">Chargement...</div>
      ) : (
        <>
          {/* Pending */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase mb-2">
              {pending.length > 0 && <Clock className="h-3.5 w-3.5 text-amber-500" />}
              En attente ({pending.length})
            </h3>
            {pending.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 py-8 text-center text-slate-400 text-sm">
                <XCircle className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                Aucune demande en attente.
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((req) => (
                  <div key={req.id} className="bg-white rounded-xl border border-amber-200 shadow-sm p-5 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800">{req.user?.userName ?? req.userId}</p>
                        <span className="text-xs text-slate-400">{req.user?.email}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{req.justification}</p>
                      <p className="text-xs text-slate-400 mt-1">Demandé le {fmtDate(req.requestedAt)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => { setApproveTarget(req); setApproveForm({ duration: 8, unit: 'HOURS' }); }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors font-medium"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approuver
                      </button>
                      <button
                        onClick={() => { setRejectTarget(req); setRejectionNote(''); }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historique */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Historique</h3>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Utilisateur</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Justification</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Traité par</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Expire le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processed.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucun historique.</td></tr>
                  ) : (
                    processed.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-700">{req.user?.userName ?? req.userId}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{req.justification}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status]}`}>
                            {STATUS_LABELS[req.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{req.reviewer?.userName ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{req.expiresAt ? fmtDate(req.expiresAt) : '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Approve Modal */}
      {approveTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Approuver l'accès de {approveTarget.user?.userName}</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              <label className="block text-sm font-medium text-slate-700">Durée de l'accès</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={approveForm.duration}
                  onChange={(e) => setApproveForm((f) => ({ ...f, duration: parseInt(e.target.value, 10) || 1 }))}
                  className="w-24 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                />
                <select
                  value={approveForm.unit}
                  onChange={(e) => setApproveForm((f) => ({ ...f, unit: e.target.value as 'HOURS' | 'DAYS' }))}
                  className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                >
                  <option value="HOURS">Heures</option>
                  <option value="DAYS">Jours</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setApproveTarget(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Annuler</button>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="px-4 py-2 text-sm bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {approveMutation.isPending ? 'Approbation...' : 'Approuver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Refuser la demande de {rejectTarget.user?.userName}</h3>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Motif (optionnel)</label>
              <textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setRejectTarget(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Annuler</button>
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Refus...' : 'Refuser'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingAccessAdmin;
