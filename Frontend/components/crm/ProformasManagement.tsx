import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import {
  getProformasPaginated,
  getProformaStatusCounts,
  deleteProforma,
  sendProforma,
  acceptProforma,
  rejectProforma,
  Proforma,
} from '../../services/apiCrm/apiProformas';
import { ProformaStatus } from '../../types';
import IconPlus from '../icons/IconPlus';
import IconDelete from '../icons/IconDelete';
import IconEdit from '../icons/IconEdit';
import IconEye from '../icons/IconEye';
import IconMail from '../icons/IconMail';
import IconCheck from '../icons/IconCheck';
import IconCancelX from '../icons/IconCancelX';
import ConfirmationModal from '../common/ConfirmationModal';
import CreateProformaModal from './CreateProformaModal';
import ProformaTemplateModal from './ProformaTemplateModal';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import Pagination from '../common/Pagination';

const PROFORMAS_PAGE_SIZE = 10;
type ProformaTab = 'all' | 'draft' | 'sent' | 'accepted' | 'rejected';
const TAB_TO_STATUS: Record<ProformaTab, ProformaStatus | undefined> = {
  all: undefined,
  draft: ProformaStatus.DRAFT,
  sent: ProformaStatus.SENT,
  accepted: ProformaStatus.ACCEPTED,
  rejected: ProformaStatus.REJECTED,
};

const ProformasManagement: React.FC = () => {
  const { t, formatCurrency, language } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
  const [deletingProforma, setDeletingProforma] = useState<Proforma | null>(null);
  const [viewingProforma, setViewingProforma] = useState<Proforma | null>(null);
  const [activeTab, setActiveTab] = useState<ProformaTab>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const { data: paginatedProformas, isLoading } = useQuery({
    queryKey: ['proformas', 'paginated', page, activeTab],
    queryFn: () =>
      getProformasPaginated({
        page,
        limit: PROFORMAS_PAGE_SIZE,
        status: TAB_TO_STATUS[activeTab],
      }),
  });

  const { data: statusCounts } = useQuery({
    queryKey: ['proformas', 'status-counts'],
    queryFn: getProformaStatusCounts,
  });

  const proformas = paginatedProformas?.data || [];
  const meta = paginatedProformas?.meta;

  const invalidateProformas = () => {
    queryClient.invalidateQueries({ queryKey: ['proformas'] });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteProforma,
    onSuccess: () => {
      invalidateProformas();
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
      toast.success(t('proforma.acceptSuccess'), t('proforma.acceptSuccessMessage'));
    },
    onError: (error: any) => {
      toast.error(t('proforma.acceptError'), error?.response?.data?.message || t('proforma.acceptErrorMessage'));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectProforma,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformas'] });
      toast.success(t('proforma.rejectSuccess'), t('proforma.rejectSuccessMessage'));
    },
    onError: (error: any) => {
      toast.error(t('proforma.rejectError'), error?.response?.data?.message || t('proforma.rejectErrorMessage'));
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
      case 'CONVERTED':
        return 'bg-teal-100 text-teal-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getTranslatedStatus = (status: string) => t(`proforma.statuses.${status}`);

  const TABS: { tab: ProformaTab; label: string; count: number }[] = [
    { tab: 'all', label: t('proforma.tabs.all'), count: statusCounts?.all ?? 0 },
    { tab: 'draft', label: t('proforma.tabs.draft'), count: statusCounts?.draft ?? 0 },
    { tab: 'sent', label: t('proforma.tabs.sent'), count: statusCounts?.sent ?? 0 },
    { tab: 'accepted', label: t('proforma.tabs.accepted'), count: statusCounts?.accepted ?? 0 },
    { tab: 'rejected', label: t('proforma.tabs.rejected'), count: statusCounts?.rejected ?? 0 },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="text-xl font-semibold text-slate-800">{t('proforma.title')}</h3>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors"
        >
          <IconPlus className="h-4 w-4" />
          <span>{t('proforma.create')}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b overflow-x-auto">
        {TABS.map(({ tab, label, count }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === tab
                ? 'border-b-2 border-[#c6e911] text-[#c6e911]'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  {t('proforma.table.number')}
                </th>
                <th scope="col" className="px-6 py-3">
                  {t('proforma.table.client')}
                </th>
                <th scope="col" className="px-6 py-3">
                  {t('proforma.table.email')}
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  {t('proforma.table.totalAmount')}
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  {t('proforma.table.status')}
                </th>
                <th scope="col" className="px-6 py-3">
                  {t('proforma.table.createdAt')}
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton rows={PROFORMAS_PAGE_SIZE} columns={7} />
              ) : proformas.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon="document" title={t('proforma.title')} description={t('proforma.empty')} />
                  </td>
                </tr>
              ) : proformas.map((proforma) => (
                <tr key={proforma.id} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold">{proforma.proformaNumber}</td>
                  <td className="px-6 py-4">{proforma.clientName}</td>
                  <td className="px-6 py-4 text-xs">{proforma.clientEmail}</td>
                  <td className="px-6 py-4 text-right font-bold">
                    {formatCurrency(Number(proforma.totalAmount))}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(proforma.status)}`}>
                      {getTranslatedStatus(proforma.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {new Date(proforma.createdAt).toLocaleDateString(language)}
                  </td>
                  <td className="px-6 py-4 text-center space-x-1">
                    <button
                      onClick={() => setViewingProforma(proforma)}
                      className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                      title={t('proforma.actions.view')}
                    >
                      <IconEye className="h-5 w-5" />
                    </button>
                    {proforma.status === 'DRAFT' && (
                      <>
                        <button
                          onClick={() => setSelectedProforma(proforma)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                          title="Éditer"
                        >
                          <IconEdit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => sendMutation.mutate(proforma.id)}
                          className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-100 rounded-full transition-colors"
                          title={t('proforma.actions.send')}
                        >
                          <IconMail className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    {(proforma.status === 'SENT' || proforma.status === 'VIEWED') && (
                      <>
                        <button
                          onClick={() => sendMutation.mutate(proforma.id)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                          title={t('proforma.actions.resend')}
                        >
                          <IconMail className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => acceptMutation.mutate(proforma.id)}
                          className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-100 rounded-full transition-colors"
                          title={t('proforma.actions.accept')}
                        >
                          <IconCheck className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(proforma.id)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                          title={t('proforma.actions.reject')}
                        >
                          <IconCancelX className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    {proforma.status === 'DRAFT' && (
                      <button
                        onClick={() => setDeletingProforma(proforma)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                        title={t('proforma.actions.delete')}
                      >
                        <IconDelete className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      {meta && <Pagination meta={meta} onPageChange={setPage} />}

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateProformaModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {selectedProforma && (
        <CreateProformaModal
          isOpen={!!selectedProforma}
          onClose={() => setSelectedProforma(null)}
          proformaToEdit={selectedProforma}
        />
      )}

      <ProformaTemplateModal
        isOpen={!!viewingProforma}
        onClose={() => setViewingProforma(null)}
        proforma={viewingProforma}
      />

      {deletingProforma && (
        <ConfirmationModal
          isOpen={!!deletingProforma}
          onClose={() => setDeletingProforma(null)}
          onConfirm={() => deleteMutation.mutate(deletingProforma.id)}
          title={t('proforma.deleteConfirmTitle')}
          message={t('proforma.deleteConfirmMessage', { number: deletingProforma.proformaNumber })}
        />
      )}
    </div>
  );
};

export default ProformasManagement;
