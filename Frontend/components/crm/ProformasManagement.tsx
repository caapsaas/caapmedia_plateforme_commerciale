import { Link } from '@tanstack/react-router';
import ConvertProformaModal from './ConvertProformaModal';
import { Eye, FileText, Send, ArrowUpRight } from 'lucide-react';
import { isSuperAdmin as hasSuperAdminRole } from '../../utils/isSuperAdmin';
import ShareProformaModal from './ShareProformaModal';
import { useAuth } from '../../context/AuthContext';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import {
  getProformasPaginated,
  getProformaStatusCounts,
  deleteProforma,
  acceptProforma,
  markProformaAsViewed,
  convertProforma,
  rejectProforma,
  Proforma,
} from '../../services/apiCrm/apiProformas';
import { ProformaStatus } from '../../types';
import IconPlus from '../icons/IconPlus';
import IconDelete from '../icons/IconDelete';
import IconEdit from '../icons/IconEdit';
import ConfirmationModal from '../common/ConfirmationModal';
import CreateProformaModal from './CreateProformaModal';
import ProformaTemplateModal from './ProformaTemplateModal';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import Pagination from '../common/Pagination';

const PROFORMAS_PAGE_SIZE = 10;
const statusActionClass =
  'inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-600 disabled:opacity-50';
const primaryActionClass =
  'inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg bg-[#c6e911] px-3 text-xs font-semibold text-slate-900 transition-colors hover:bg-[#adc40f] focus-visible:outline-2 focus-visible:outline-slate-600 disabled:opacity-50';
const TAB_TO_STATUS = {
  all: undefined,
  draft: ProformaStatus.DRAFT,
  sent: ProformaStatus.SENT,
  viewed: ProformaStatus.VIEWED,
  accepted: ProformaStatus.ACCEPTED,
  converted: ProformaStatus.CONVERTED,
  rejected: ProformaStatus.REJECTED,
  expired: ProformaStatus.EXPIRED,
};
type ProformaTab = keyof typeof TAB_TO_STATUS;

const ProformasManagement: React.FC = () => {
  const { user } = useAuth();
  const readOnly = hasSuperAdminRole(user);
  const activeRole = user?.activeRole ?? user?.userRole;

  const { t, formatCurrency, language } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sharingProforma, setSharingProforma] = useState<Proforma | null>(null);
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
  const [deletingProforma, setDeletingProforma] = useState<Proforma | null>(null);
  const [viewingProforma, setViewingProforma] = useState<Proforma | null>(null);
  const [rejectingProforma, setRejectingProforma] = useState<Proforma | null>(null);
  const [convertingProforma, setConvertingProforma] = useState<Proforma | null>(null);
  const [statusActionsId, setStatusActionsId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProformaTab>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    setStatusActionsId(null);
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

  const viewMutation = useMutation({
    mutationFn: markProformaAsViewed,
    onSuccess: () => {
      setStatusActionsId(null);
      invalidateProformas();
      toast.success(t('proforma.viewedSuccess'));
    },
    onError: () => {
      invalidateProformas();
      toast.error(t('proforma.viewedError'));
    },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptProforma,
    onSuccess: () => {
      setStatusActionsId(null);
      queryClient.invalidateQueries({ queryKey: ['proformas'] });
      toast.success(t('proforma.acceptSuccess'), t('proforma.acceptSuccessMessage'));
    },
    onError: (error: any) => {
      invalidateProformas();
      toast.error(t('proforma.acceptError'), error?.response?.data?.message || t('proforma.acceptErrorMessage'));
    },
  });

  const convertMutation = useMutation({
    mutationFn: convertProforma,
    onSuccess: () => {
      setStatusActionsId(null);
      setConvertingProforma(null);
      invalidateProformas();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(t('proforma.convertSuccess'), t('proforma.convertSuccessMessage'));
    },
    onError: (error: any) => {
      invalidateProformas();
      toast.error(t('proforma.convertError'), error?.response?.data?.message || t('proforma.convertErrorMessage'));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectProforma,
    onSuccess: () => {
      setStatusActionsId(null);
      setRejectingProforma(null);
      queryClient.invalidateQueries({ queryKey: ['proformas'] });
      toast.success(t('proforma.rejectSuccess'), t('proforma.rejectSuccessMessage'));
    },
    onError: (error: any) => {
      invalidateProformas();
      toast.error(t('proforma.rejectError'), error?.response?.data?.message || t('proforma.rejectErrorMessage'));
    },
  });

  const statusPending =
    viewMutation.isPending || acceptMutation.isPending || rejectMutation.isPending || convertMutation.isPending;

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

  const tabs = (Object.keys(TAB_TO_STATUS) as ProformaTab[]).map((tab) => ({
    tab,
    label: t(`proforma.tabs.${tab}`),
    count: statusCounts?.[tab] ?? 0,
  }));

  return (
    <section
      className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      aria-labelledby="proformas-title"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#c6e911]/25 text-slate-900">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 id="proformas-title" className="text-xl font-bold tracking-tight text-slate-900">
            {t('proforma.title')}
          </h2>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className={primaryActionClass + ' min-h-10 px-4 text-sm'}
          >
            <IconPlus className="h-4 w-4" />
            {t('proforma.form.create')}
          </button>
        )}
      </header>

      <div className="flex flex-wrap gap-2 border-y border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
        {tabs.map(({ tab, label, count }) => (
          <button
            type="button"
            key={tab}
            aria-pressed={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-slate-600 ${
              activeTab === tab
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            {label}
            <span
              className={`min-w-5 rounded-md px-1 text-center text-xs tabular-nums ${activeTab === tab ? 'bg-[#c6e911] text-slate-900' : 'bg-slate-200/70 text-slate-700'}`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto" aria-busy={isLoading}>
        {isLoading && (
          <div className="space-y-2 px-4 py-5 motion-safe:animate-pulse md:hidden" aria-hidden="true">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-3 w-48 max-w-full rounded bg-slate-100" />
          </div>
        )}
        <table className="block w-full text-left text-sm text-slate-700 md:table">
          <thead className="hidden border-b border-slate-200 bg-white text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-header-group">
            <tr>
              <th scope="col" className="px-4 py-3 sm:pl-6">
                {t('proforma.table.number')}
              </th>
              <th scope="col" className="px-4 py-3">
                {t('proforma.table.client')}
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                {t('proforma.table.totalAmount')}
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                {t('proforma.table.status')}
              </th>
              <th scope="col" className="px-4 py-3">
                {t('proforma.table.createdAt')}
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className={isLoading ? 'hidden md:table-row-group' : 'block md:table-row-group'}>
            {isLoading ? (
              <TableSkeleton rows={PROFORMAS_PAGE_SIZE} columns={6} />
            ) : proformas.length === 0 ? (
              <tr className="block md:table-row">
                <td colSpan={6} className="block md:table-cell">
                  <EmptyState icon="document" title={t('proforma.title')} description={t('proforma.empty')} />
                </td>
              </tr>
            ) : (
              proformas.map((proforma) => (
                <tr
                  key={proforma.id}
                  className="grid grid-cols-2 gap-x-3 gap-y-2 border-b border-slate-100 px-4 py-4 transition-colors last:border-b-0 hover:bg-slate-50/80 md:table-row"
                >
                  <td className="md:px-4 md:py-4 md:pl-6">
                    <button
                      type="button"
                      onClick={() => setViewingProforma(proforma)}
                      aria-label={`${t('proforma.previewPdf')} · ${proforma.proformaNumber}`}
                      className="inline-flex items-center gap-1 whitespace-nowrap text-left font-bold text-slate-900 hover:underline focus-visible:outline-2 focus-visible:outline-slate-600"
                    >
                      {proforma.proformaNumber}
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                    </button>
                    {proforma.orderId && (
                      <div className="mt-1 text-xs text-slate-600">
                        {['ADMIN', 'FINANCIAL_DIRECTOR'].includes(activeRole ?? '') ||
                        (activeRole === 'COMMERCIAL' && proforma.order?.salesRepId === user?.id) ? (
                          <Link
                            to="/dashboard/sales"
                            hash={proforma.orderId}
                            className="font-semibold text-slate-800 underline decoration-slate-300 underline-offset-2 hover:decoration-current"
                          >
                            {t('proforma.viewOrder')} · {proforma.orderId}
                          </Link>
                        ) : (
                          <span>
                            {t('proforma.orderReference')} · {proforma.orderId}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="col-span-2 row-start-2 min-w-0 md:px-4 md:py-4">
                    <div className="break-words font-semibold text-slate-800">{proforma.clientName}</div>
                    <div className="mt-0.5 break-all text-xs text-slate-500">{proforma.clientEmail}</div>
                  </td>
                  <td className="col-start-2 row-start-1 whitespace-nowrap text-right font-bold tabular-nums text-slate-900 md:px-4 md:py-4">
                    {formatCurrency(Number(proforma.totalAmount), 2)}
                  </td>
                  <td className="md:px-4 md:py-4 md:text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(proforma.status)}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                      {getTranslatedStatus(proforma.status)}
                    </span>
                  </td>
                  <td className="self-center whitespace-nowrap text-right text-xs tabular-nums text-slate-500 md:px-4 md:py-4 md:text-left">
                    {new Date(proforma.createdAt).toLocaleDateString(language)}
                  </td>
                  <td className="col-span-2 md:px-4 md:py-4">
                    <div className="flex flex-wrap items-center justify-end gap-1 md:justify-center">
                      <button
                        type="button"
                        onClick={() => setViewingProforma(proforma)}
                        className={statusActionClass}
                        aria-haspopup="dialog"
                        aria-label={t('proforma.previewPdf')}
                        title={t('proforma.previewPdf')}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </button>
                      {!readOnly && proforma.status === 'DRAFT' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedProforma(proforma)}
                            className={statusActionClass}
                            aria-label={t('proforma.actions.edit')}
                            title={t('proforma.actions.edit')}
                          >
                            <IconEdit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSharingProforma(proforma)}
                            className={primaryActionClass}
                          >
                            <Send className="h-3.5 w-3.5" aria-hidden="true" />
                            {t('proforma.actions.send')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProforma(proforma)}
                            className={statusActionClass}
                            aria-label={t('proforma.actions.delete')}
                            title={t('proforma.actions.delete')}
                          >
                            <IconDelete className="h-4 w-4 text-red-700" />
                          </button>
                        </>
                      )}
                      {!readOnly && (proforma.status === 'SENT' || proforma.status === 'VIEWED') && (
                        <button
                          type="button"
                          onClick={() => setSharingProforma(proforma)}
                          className={statusActionClass}
                          disabled={statusPending}
                        >
                          {t('proforma.actions.resend')}
                        </button>
                      )}
                      {!readOnly && ['SENT', 'VIEWED', 'ACCEPTED'].includes(proforma.status) && (
                        <button
                          type="button"
                          className={primaryActionClass}
                          disabled={statusPending}
                          aria-expanded={statusActionsId === proforma.id}
                          aria-controls={`proforma-status-actions-${proforma.id}`}
                          onClick={() => setStatusActionsId(statusActionsId === proforma.id ? null : proforma.id)}
                        >
                          {t('proforma.changeStatus')}
                        </button>
                      )}
                      <div
                        id={`proforma-status-actions-${proforma.id}`}
                        hidden={readOnly || statusActionsId !== proforma.id}
                        className="w-full text-right md:text-center"
                      >
                        {proforma.status === 'SENT' && (
                          <button
                            type="button"
                            className={statusActionClass}
                            disabled={statusPending}
                            onClick={() => viewMutation.mutate(proforma.id)}
                          >
                            {t('proforma.markViewed')}
                          </button>
                        )}
                        {(proforma.status === 'SENT' || proforma.status === 'VIEWED') && (
                          <>
                            <button
                              type="button"
                              className={statusActionClass}
                              disabled={statusPending}
                              onClick={() => acceptMutation.mutate(proforma.id)}
                            >
                              {t('proforma.actions.accept')}
                            </button>
                            <button
                              type="button"
                              className={statusActionClass}
                              disabled={statusPending}
                              onClick={() => setRejectingProforma(proforma)}
                            >
                              {t('proforma.actions.reject')}
                            </button>
                          </>
                        )}
                        {proforma.status === 'ACCEPTED' && (
                          <button
                            type="button"
                            className={statusActionClass}
                            disabled={statusPending}
                            onClick={() => setConvertingProforma(proforma)}
                          >
                            {t('proforma.actions.convert')}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {meta && meta.totalPages > 1 && (
        <div className="border-t border-slate-200 px-4 py-2 sm:px-6">
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && !readOnly && (
        <CreateProformaModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      )}

      {selectedProforma && (
        <CreateProformaModal
          isOpen={!!selectedProforma}
          onClose={() => setSelectedProforma(null)}
          proformaToEdit={selectedProforma}
        />
      )}

      {sharingProforma && (
        <ShareProformaModal
          key={sharingProforma.id}
          proforma={sharingProforma}
          onClose={() => setSharingProforma(null)}
        />
      )}
      <ProformaTemplateModal
        isOpen={!!viewingProforma}
        onClose={() => setViewingProforma(null)}
        proforma={viewingProforma}
      />

      {convertingProforma && !readOnly && (
        <ConvertProformaModal
          key={convertingProforma.id}
          proforma={convertingProforma}
          isPending={convertMutation.isPending}
          onClose={() => {
            if (!convertMutation.isPending) setConvertingProforma(null);
          }}
          onConfirm={(input) => convertMutation.mutate({ id: convertingProforma.id, ...input })}
        />
      )}

      {rejectingProforma && !readOnly && (
        <ConfirmationModal
          isOpen
          onClose={() => {
            if (!rejectMutation.isPending) setRejectingProforma(null);
          }}
          onConfirm={() => rejectMutation.mutate(rejectingProforma.id)}
          title={t('proforma.actions.reject')}
          message={t('proforma.rejectConfirmation', { number: rejectingProforma.proformaNumber })}
          confirmButtonText={t('proforma.actions.reject')}
          isDangerous
          isLoading={rejectMutation.isPending}
        />
      )}

      {deletingProforma && (
        <ConfirmationModal
          isOpen={!!deletingProforma}
          onClose={() => setDeletingProforma(null)}
          onConfirm={() => deleteMutation.mutate(deletingProforma.id)}
          title={t('proforma.deleteConfirmTitle')}
          message={t('proforma.deleteConfirmMessage', { number: deletingProforma.proformaNumber })}
        />
      )}
    </section>
  );
};

export default ProformasManagement;
