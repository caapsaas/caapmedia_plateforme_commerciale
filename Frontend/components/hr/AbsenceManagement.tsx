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
import SearchBar from './SearchBar';
import IconUsers from '../icons/IconUsers';
import { generateDailyAbsences } from '../../services/apihr/apiAbsences';
import { api } from '../../services/api';
import { RefreshCw } from 'lucide-react';

interface AbsenceManagementProps {
  subsidiary: Subsidiary;
  employees: Employee[];
  absences: AbsenceRecord[];
  onSave: UseMutateFunction<AbsenceRecord, Error, Partial<AbsenceRecord>, unknown>;
  onDelete: UseMutateFunction<AbsenceRecord, Error, string, unknown>;
}

const AbsenceManagement: React.FC<AbsenceManagementProps> = ({
  subsidiary,
  employees,
  absences,
  onSave,
  onDelete,
}) => {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<AbsenceRecord | null>(null);
  const [deletingAbsence, setDeletingAbsence] = useState<AbsenceRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | AbsenceType>('ALL');
  const [monthFilter, setMonthFilter] = useState(''); // '' = tous les mois

  // Mutation génération auto des absences
  const generateMutation = useMutation({
    mutationFn: generateDailyAbsences,
    onSuccess: (result) => {
      toast.success('Génération terminée', result.message);
      queryClient.invalidateQueries({ queryKey: ['absence-records'] });
    },
    onError: (error: any) => {
      toast.error(
        'Erreur de génération',
        error?.response?.data?.message ||
          'Impossible de générer les absences automatiquement.',
      );
    },
  });

  const filteredAbsences = useMemo(() => {
    return absences.filter((record) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchLower ||
        record.employeeName.toLowerCase().includes(searchLower) ||
        record.reason.toLowerCase().includes(searchLower) ||
        record.startDate.includes(searchTerm) ||
        record.endDate.includes(searchTerm);

      const matchesType =
        typeFilter === 'ALL' || record.typeAbsence === typeFilter;

      // Filtre par mois (format YYYY-MM)
      const matchesMonth =
        !monthFilter ||
        record.startDate.startsWith(monthFilter) ||
        record.endDate.startsWith(monthFilter);

      return matchesSearch && matchesType && matchesMonth;
    });
  }, [absences, searchTerm, typeFilter, monthFilter]);

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
    if (
      window.confirm(
        "Générer automatiquement les absences pour tous les employés sans présence aujourd'hui ?",
      )
    ) {
      generateMutation.mutate();
    }
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
        <div className="no-print flex flex-col sm:flex-row gap-3 flex-wrap">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t('common.search') || 'Rechercher les absences...'}
            className="max-w-md"
          />

          {/* Filtre par type */}
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as 'ALL' | AbsenceType)
            }
            className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
          >
            <option value="ALL">Tous les types</option>
            <option value={AbsenceType.JUSTIFIED}>Justifiées</option>
            <option value={AbsenceType.UNJUSTIFIED}>Non justifiées</option>
          </select>

          {/* Filtre par mois */}
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
            title="Filtrer par mois"
          />

          {/* Bouton reset mois */}
          {monthFilter && (
            <button
              onClick={() => setMonthFilter('')}
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              title="Effacer le filtre mois"
            >
              ✕ Mois
            </button>
          )}
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
            {filteredAbsences.length !== absences.length && (
              <span className="ml-1">
                ({filteredAbsences.length} sur {absences.length})
              </span>
            )}
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
              {filteredAbsences.length > 0 ? (
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
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Aucune absence trouvée
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
    </div>
  );
};

export default AbsenceManagement;