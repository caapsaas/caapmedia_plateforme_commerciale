import React, { useState, useMemo } from 'react';
import { Subsidiary, AbsenceRecord, AbsenceType, Employee } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import IconDownload from '../icons/IconDownload';
import AbsenceFormModal from './AbsenceFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import { formatDate } from '../../utils/dateFormatter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';
import { UseMutateFunction, useMutation, useQueryClient } from '@tanstack/react-query';
import IconUsers from '../icons/IconUsers';
import { generateDailyAbsences } from '../../services/apihr/apiAbsences';
import { api } from '../../services/api';
import { RefreshCw, Search, Filter, X } from 'lucide-react';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';

interface AbsenceManagementProps {
  subsidiary: Subsidiary;
  employees: Employee[];
  absences: AbsenceRecord[];
  isLoading?: boolean;
  onSave: UseMutateFunction<AbsenceRecord, Error, Partial<AbsenceRecord>, unknown>;
  onDelete: UseMutateFunction<AbsenceRecord, Error, string, unknown>;
}

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'Tous les types' },
  { value: 'JUSTIFIED', label: 'Justifiées' },
  { value: 'UNJUSTIFIED', label: 'Non justifiées' },
] as const;

const AbsenceManagement: React.FC<AbsenceManagementProps> = ({
  subsidiary,
  employees,
  absences,
  isLoading = false,
  onSave,
  onDelete,
}) => {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<AbsenceRecord | null>(null);
  const [deletingAbsence, setDeletingAbsence] = useState<AbsenceRecord | null>(null);
  const [generatingAbsences, setGeneratingAbsences] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | AbsenceType>(AbsenceType.UNJUSTIFIED);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Mutation génération auto des absences
  const generateMutation = useMutation({
    mutationFn: generateDailyAbsences,
    onSuccess: (result) => {
      toast.success('Génération terminée', result.message);
      queryClient.invalidateQueries({ queryKey: ['absence-records'] });
      handleCloseModals();
    },
    onError: (error: any) => {
      toast.error(
        'Erreur de génération',
        error?.response?.data?.message ||
          'Impossible de générer les absences automatiquement.',
      );
      handleCloseModals();
    },
  });

  const filteredAbsences = useMemo(() => {
    return absences.filter((record) => {
      // Filtre recherche
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchLower ||
        record.employeeName?.toLowerCase().includes(searchLower) ||
        record.reason?.toLowerCase().includes(searchLower) ||
        record.startDate?.includes(searchTerm) ||
        record.endDate?.includes(searchTerm);

      // Filtre type
      const matchesType =
        typeFilter === 'ALL' || record.typeAbsence === typeFilter;

      // Helper pour extraire la date au format YYYY-MM-DD
      const getDatePart = (dateStr: string | undefined | null): string => {
        if (!dateStr) return '';
        // Si la date contient un T, on prend la partie avant
        if (dateStr.includes('T')) return dateStr.split('T')[0];
        // Sinon on retourne la date telle quelle (déjà au format YYYY-MM-DD)
        return dateStr;
      };

      const startDate = getDatePart(record.startDate);
      const endDate = getDatePart(record.endDate);

      // Filtre date début
      const matchesDateFrom = !dateFrom || endDate >= dateFrom;

      // Filtre date fin
      const matchesDateTo = !dateTo || startDate <= dateTo;

      return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
    });
  }, [absences, searchTerm, typeFilter, dateFrom, dateTo]);

  const hasActiveFilters =
    searchTerm !== '' ||
    typeFilter !== 'ALL' ||
    dateFrom !== '' ||
    dateTo !== '';

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  const absenceStats = useMemo(() => {
    const justified = filteredAbsences.filter(
      (a) => a.typeAbsence === AbsenceType.JUSTIFIED,
    ).length;
    const unjustified = filteredAbsences.filter(
      (a) => a.typeAbsence === AbsenceType.UNJUSTIFIED,
    ).length;
    const total = filteredAbsences.length;

    return { justified, unjustified, total };
  }, [filteredAbsences]);

  const handleOpenAddModal = () => {
    setEditingAbsence(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (absence: AbsenceRecord) => {
    setEditingAbsence(absence);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (absence: AbsenceRecord) => {
    setDeletingAbsence(absence);
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setDeletingAbsence(null);
    setEditingAbsence(null);
    setGeneratingAbsences(false);
  };

  const handleSaveAbsence = (absenceData: Partial<AbsenceRecord>) => {
    try {
      onSave(absenceData);
      const action = editingAbsence ? 'modifiée' : 'ajoutée';
      toast.success(
        'Absence enregistrée!',
        `L'absence a été ${action} avec succès.`,
      );
      handleCloseModals();
    } catch (error) {
      toast.error(
        'Erreur de sauvegarde',
        "Une erreur est survenue lors de la sauvegarde de l'absence.",
      );
    }
  };

  const handleDeleteAbsence = () => {
    try {
      if (deletingAbsence) {
        onDelete(deletingAbsence.id);
        toast.success(
          'Absence supprimée!',
          "L'absence a été supprimée avec succès.",
        );
        handleCloseModals();
      }
    } catch (error) {
      toast.error(
        'Erreur de suppression',
        "Une erreur est survenue lors de la suppression de l'absence.",
      );
    }
  };

  const handleGenerateDaily = () => {
    setGeneratingAbsences(true);
  };

  const handleConfirmGenerateDaily = () => {
    generateMutation.mutate();
  };

  const getTypeClass = (type: AbsenceType) => {
    switch (type) {
      case AbsenceType.JUSTIFIED:
        return 'bg-yellow-100 text-yellow-800';
      case AbsenceType.UNJUSTIFIED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handlePrint = () => {
    window.print();
    toast.info("Impression lancée", "La page est en cours d'impression.");
  };

  const handleExportCsv = () => {
    try {
      const headers = [
        { key: 'employeeName', label: t('hr.absences.table.employee') },
        { key: 'typeAbsence', label: t('hr.absences.table.type') },
        { key: 'startDate', label: t('hr.absences.table.startDate') },
        { key: 'endDate', label: t('hr.absences.table.endDate') },
        { key: 'reason', label: t('hr.absences.table.reason') },
      ];
      const data = absences.map((r) => ({
        ...r,
        typeAbsence: t(`hr.absenceType.${r.typeAbsence}`),
      }));
      exportToCsv('registre_absences', headers, data);
      toast.success(
        'Export CSV réussi!',
        'Les données ont été exportées au format CSV.',
      );
    } catch (error) {
      toast.error(
        "Erreur d'export",
        "Une erreur est survenue lors de l'export CSV.",
      );
    }
  };

  const handleExportPdf = () => {
    try {
      const headers = [
        { key: 'employeeName', label: t('hr.absences.table.employee') },
        { key: 'typeAbsence', label: t('hr.absences.table.type') },
        { key: 'startDate', label: t('hr.absences.table.startDate') },
        { key: 'endDate', label: t('hr.absences.table.endDate') },
        { key: 'reason', label: t('hr.absences.table.reason') },
      ];
      const data = absences.map((r) => ({
        ...r,
        typeAbsence: t(`hr.absenceType.${r.typeAbsence}`),
      }));
      exportToPdf(t('hr.absences.title'), headers, data, 'absences');
      toast.success(
        'Export PDF réussi!',
        'Les données ont été exportées au format PDF.',
      );
    } catch (error) {
      toast.error(
        "Erreur d'export",
        "Une erreur est survenue lors de l'export PDF.",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-slate-900">
            {t('hr.absences.title')}
          </h1>
          <div className="flex items-center space-x-2 no-print flex-wrap">
            {/* Bouton génération auto */}
            <button
              onClick={handleGenerateDaily}
              disabled={generateMutation.isPending}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-md hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title="Créer une absence UNJUSTIFIED pour chaque employé sans présence aujourd'hui"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  generateMutation.isPending ? 'animate-spin' : ''
                }`}
              />
              <span>
                {generateMutation.isPending
                  ? 'Génération...'
                  : 'Générer absences du jour'}
              </span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors"
            >
              <IconPlus className="h-4 w-4" />
              <span>{t('hr.absences.add')}</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
              aria-label={t('common.print')}
              title={t('common.print')}
            >
              <IconPrint className="h-5 w-5" />
            </button>
            <button
              onClick={handleExportCsv}
              className="p-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
              aria-label={t('common.export')}
              title={t('common.export')}
            >
              <IconExport className="h-5 w-5" />
            </button>
            <button
              onClick={handleExportPdf}
              className="p-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
              aria-label={t('common.exportPdf')}
              title={t('common.exportPdf')}
            >
              <IconPdf className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder={t('common.search') || 'Rechercher les absences...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
              />
            </div>

            {/* Filtre type */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as 'ALL' | AbsenceType)
                }
                className="border border-slate-200 rounded-lg pl-10 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911] appearance-none bg-white min-w-[180px]"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date de */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
              title="Date de début"
            />

            {/* Date à */}
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
              title="Date de fin"
            />

            {/* Reset */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Réinitialiser
              </button>
            )}
          </div>

          {/* Compteur de résultats */}
          <p className="text-xs text-slate-500">
            {filteredAbsences.length} résultat
            {filteredAbsences.length !== 1 ? 's' : ''}
            {hasActiveFilters && absences
              ? ` sur ${absences.length}`
              : ''}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Justifiées</p>
              <p className="text-2xl font-bold text-yellow-600">
                {absenceStats.justified}
              </p>
            </div>
            <div className="text-yellow-100">
              <IconUsers className="h-10 w-10" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">
                Non justifiées
              </p>
              <p className="text-2xl font-bold text-red-600">
                {absenceStats.unjustified}
              </p>
            </div>
            <div className="text-red-100">
              <IconUsers className="h-10 w-10" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-slate-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-slate-700">
                {absenceStats.total}
              </p>
            </div>
            <div className="text-slate-200">
              <IconUsers className="h-10 w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Absences Table Section */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">
            Registre des absences
          </h2>
          <p className="text-sm text-slate-500">
            Liste des absences enregistrées
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  {t('hr.absences.table.employee')}
                </th>
                <th scope="col" className="px-6 py-3">
                  {t('hr.absences.table.type')}
                </th>
                <th scope="col" className="px-6 py-3">
                  {t('hr.absences.table.startDate')}
                </th>
                <th scope="col" className="px-6 py-3">
                  {t('hr.absences.table.endDate')}
                </th>
                <th scope="col" className="px-6 py-3">
                  {t('hr.absences.table.reason')}
                </th>
                <th scope="col" className="px-6 py-3 text-center no-print">
                  {t('hr.absences.table.document')}
                </th>
                <th scope="col" className="px-6 py-3 text-center no-print">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton rows={7} columns={7} />
              ) : filteredAbsences.length > 0 ? (
                filteredAbsences.map((record) => (
                  <tr
                    key={record.id}
                    className="bg-white border-b hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-semibold">
                      {record.employeeName}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeClass(
                          record.typeAbsence,
                        )}`}
                      >
                        {t(`hr.absenceType.${record.typeAbsence}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {formatDate(record.startDate)}
                    </td>
                    <td className="px-6 py-4">
                      {formatDate(record.endDate)}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      {record.reason}
                    </td>
                    <td className="px-6 py-4 text-center no-print">
                      {record.documentUrl ? (
                        <a
                          href={`${api.defaults.baseURL}${record.documentUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 px-3 py-1 bg-sky-100 text-sky-700 text-xs font-semibold rounded-md hover:bg-sky-200 transition-colors"
                        >
                          <IconDownload className="h-4 w-4" />
                          <span>{t('hr.absences.table.download')}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {t('hr.absences.table.noDocument')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center space-x-1 no-print">
                      <button
                        onClick={() => handleOpenEditModal(record)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                        aria-label={t('common.edit')}
                      >
                        <IconEdit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(record)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                        aria-label={t('common.delete')}
                      >
                        <IconDelete className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon="inbox" title="Aucune absence trouvée" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormModalOpen && (
        <AbsenceFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModals}
          onSave={handleSaveAbsence}
          absence={editingAbsence}
          employees={employees}
          subsidiary={subsidiary}
        />
      )}

      {deletingAbsence && (
        <ConfirmationModal
          isOpen={!!deletingAbsence}
          onClose={handleCloseModals}
          onConfirm={handleDeleteAbsence}
          title={t('configuration.modal.deleteAbsenceTitle')}
          message={t('configuration.modal.deleteConfirmMessage', {
            itemName: `${t('hr.absences.title')} for ${deletingAbsence.employeeName}`,
          })}
        />
      )}

      {generatingAbsences && (
        <ConfirmationModal
          isOpen={generatingAbsences}
          onClose={handleCloseModals}
          onConfirm={handleConfirmGenerateDaily}
          title="Générer les absences"
          message="Générer automatiquement les absences pour tous les employés sans présence aujourd'hui ?"
          confirmButtonText="Oui, générer"
          isLoading={generateMutation.isPending}
        />
      )}
    </div>
  );
};

export default AbsenceManagement;