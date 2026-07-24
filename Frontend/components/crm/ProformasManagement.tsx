import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../i18n';
import {
  getProformas,
  deleteProforma,
  sendProforma,
  acceptProforma,
  rejectProforma,
  Proforma,
} from '../../services/apiCrm/apiProformas';
import { getLeads } from '../../services/apiCrm/apiCrm';
import IconPlus from '../icons/IconPlus';
import IconDelete from '../icons/IconDelete';
import IconEdit from '../icons/IconEdit';
import IconDownload from '../icons/IconDownload';
import ConfirmationModal from '../common/ConfirmationModal';
import CreateProformaModal from './CreateProformaModal';

const ProformasManagement: React.FC = () => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
  const [deletingProforma, setDeletingProforma] = useState<Proforma | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'accepted' | 'rejected'>(
    'all',
  );

  const { data: proformas = [], isLoading } = useQuery({
    queryKey: ['proformas'],
    queryFn: getProformas,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => getLeads(''),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProforma,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformas'] });
      setDeletingProforma(null);
    },
  });

  const sendMutation = useMutation({
    mutationFn: sendProforma,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformas'] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptProforma,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformas'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectProforma,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformas'] });
    },
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-blue-100 text-blue-800';
      case 'SENT':
        return 'bg-yellow-100 text-yellow-800';
      case 'VIEWED':
        return 'bg-purple-100 text-purple-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredProformas = proformas.filter((p) => {
    if (activeTab === 'all') return true;
    return p.status.toLowerCase() === activeTab.toUpperCase();
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-slate-800">Proformas (Devis)</h3>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors"
        >
          <IconPlus className="h-4 w-4" />
          <span>Créer Proforma</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'all'
              ? 'border-b-2 border-[#c6e911] text-[#c6e911]'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Toutes ({proformas.length})
        </button>
        <button
          onClick={() => setActiveTab('draft')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'draft'
              ? 'border-b-2 border-[#c6e911] text-[#c6e911]'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Brouillons ({proformas.filter((p) => p.status === 'DRAFT').length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'sent'
              ? 'border-b-2 border-[#c6e911] text-[#c6e911]'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Envoyées ({proformas.filter((p) => p.status === 'SENT').length})
        </button>
        <button
          onClick={() => setActiveTab('accepted')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'accepted'
              ? 'border-b-2 border-[#c6e911] text-[#c6e911]'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Acceptées ({proformas.filter((p) => p.status === 'ACCEPTED').length})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'rejected'
              ? 'border-b-2 border-[#c6e911] text-[#c6e911]'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Refusées ({proformas.filter((p) => p.status === 'REJECTED').length})
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Chargement...</div>
      ) : filteredProformas.length === 0 ? (
        <div className="text-center py-8 text-slate-500">Aucune proforma trouvée</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Numéro
                </th>
                <th scope="col" className="px-6 py-3">
                  Client
                </th>
                <th scope="col" className="px-6 py-3">
                  Email
                </th>
                <th scope="col" className="px-6 py-3">
                  Montant Total
                </th>
                <th scope="col" className="px-6 py-3">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3">
                  Créée le
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProformas.map((proforma) => (
                <tr key={proforma.id} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold">{proforma.proformaNumber}</td>
                  <td className="px-6 py-4">{proforma.clientName}</td>
                  <td className="px-6 py-4 text-xs">{proforma.clientEmail}</td>
                  <td className="px-6 py-4 font-bold">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XAF',
                    }).format(Number(proforma.totalAmount))}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(proforma.status)}`}>
                      {proforma.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {new Date(proforma.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-center space-x-1">
                    {proforma.status === 'DRAFT' && (
                      <>
                        <button
                          onClick={() => setSelectedProforma(proforma)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                          title="Éditer"
                        >
                          <IconEdit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => sendMutation.mutate(proforma.id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-full"
                          title="Envoyer"
                        >
                          📤
                        </button>
                      </>
                    )}
                    {proforma.status === 'SENT' && (
                      <button
                        onClick={() => sendMutation.mutate(proforma.id)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                        title="Renvoyer"
                      >
                        📤
                      </button>
                    )}
                    <button
                      onClick={() => setDeletingProforma(proforma)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                      title="Supprimer"
                    >
                      <IconDelete className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateProformaModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          leads={leads}
        />
      )}

      {deletingProforma && (
        <ConfirmationModal
          isOpen={!!deletingProforma}
          onClose={() => setDeletingProforma(null)}
          onConfirm={() => deleteMutation.mutate(deletingProforma.id)}
          title="Supprimer la proforma"
          message={`Êtes-vous sûr de vouloir supprimer la proforma ${deletingProforma.proformaNumber}?`}
        />
      )}
    </div>
  );
};

export default ProformasManagement;
