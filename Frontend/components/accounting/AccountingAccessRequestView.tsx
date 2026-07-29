import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, ShieldAlert } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { createAccessRequest, MyAccessStatus } from '../../services/apiAccounting/apiAccountingAccess';

interface AccountingAccessRequestViewProps {
  status: MyAccessStatus;
}

/**
 * Écran affiché tant qu'aucun accès actif à la comptabilité n'existe pour
 * l'utilisateur courant (gate JIT — voir accounting-access.guard.ts côté
 * backend). Permet de soumettre une demande justifiée, ou affiche l'état
 * "en attente" si une demande est déjà en cours de validation.
 */
const AccountingAccessRequestView: React.FC<AccountingAccessRequestViewProps> = ({ status }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [justification, setJustification] = useState('');

  const requestMutation = useMutation({
    mutationFn: () => createAccessRequest(justification),
    onSuccess: () => {
      toast.success('Demande envoyée. Un administrateur du siège doit l\'approuver.');
      queryClient.invalidateQueries({ queryKey: ['accounting-access-my-status'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la demande.'),
  });

  if (status.reason === 'PENDING') {
    return (
      <div className="max-w-lg mx-auto mt-12 bg-white rounded-2xl border border-amber-200 shadow-sm p-8 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
          <Clock className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Demande en attente</h2>
        <p className="text-sm text-slate-500">
          Votre demande d'accès à la comptabilité a été envoyée et attend l'approbation d'un administrateur du siège.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-5">
      <div className="text-center space-y-2">
        <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-slate-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Accès comptabilité restreint</h2>
        <p className="text-sm text-slate-500">
          La comptabilité est un module sensible. Décrivez pourquoi vous avez besoin d'y accéder — un administrateur
          du siège approuvera ou refusera votre demande, avec une durée d'accès limitée.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Justification</label>
        <textarea
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          rows={4}
          minLength={10}
          placeholder="Ex : besoin de clôturer les écritures de trésorerie du mois de juillet."
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
        />
      </div>

      <button
        onClick={() => requestMutation.mutate()}
        disabled={requestMutation.isPending || justification.trim().length < 10}
        className="w-full px-4 py-2.5 text-sm bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#b5d500] transition-colors disabled:opacity-50"
      >
        {requestMutation.isPending ? 'Envoi...' : "Demander l'accès"}
      </button>
    </div>
  );
};

export default AccountingAccessRequestView;
