import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UseMutateFunction } from '@tanstack/react-query';
import { Subsidiary, Employee, EmployeeFormData, ContractType, EmployeeStatus } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../common/ConfirmationModal';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import SearchBar from './SearchBar';
import { getEmployees, getEmployeesPaginated, uploadDocumentFile, addDocumentToEmployee } from '../../services/apihr/apiEmployees';
import { uploadEmployeeDocuments, deleteEmployeeDocument } from '../../services/apihr/apiEmployeeDocuments';

// New UI Components
import Card, { CardBody } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Plus, BarChart, FileText, Eye, Edit, Trash } from '../ui/Icons';
import EmployeeStats from './EmployeeStats';
import EmployeeFilters from './EmployeeFilters';
import EmployeeCard from './EmployeeCard';
import EmployeeCardSkeleton from './EmployeeCardSkeleton';
import EmployeeFormModalModern from './EmployeeFormModalModern';
import EmployeeDetailsModalModern from './EmployeeDetailsModalModern';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import Pagination from '../common/Pagination';

const EMPLOYEES_PAGE_SIZE = 10;

interface EmployeeDatabaseModernProps {
  subsidiary: Subsidiary;
  subsidiaryFilterId?: string;
  onSave: UseMutateFunction<Employee, Error, Partial<Employee>, unknown>;
  onDelete: UseMutateFunction<Employee, Error, string, unknown>;
}

type ViewMode = 'table' | 'cards';
type SortMode = 'name-asc' | 'name-desc' | 'hire-date' | 'salary';

const hasFileObject = (obj: any): boolean => {
  return obj && typeof obj === 'object' && 'file' in obj;
};

const EmployeeDatabaseModern: React.FC<EmployeeDatabaseModernProps> = ({
  subsidiary,
  subsidiaryFilterId,
  onSave,
  onDelete,
}) => {
  const { t, formatCurrency } = useI18n();
  const toast = useToast();

  // State
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem('employeeSearchTerm') || '';
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('employeeViewMode');
    return (saved as ViewMode) || 'table';
  });
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    const saved = localStorage.getItem('employeeSortMode');
    return (saved as SortMode) || 'name-asc';
  });
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Recherche déportée côté serveur (porte sur l'ensemble des employés, pas
  // seulement la page affichée) — le tri, lui, reste appliqué côté client
  // sur la page courante.
  const { data: paginatedEmployees, isLoading } = useQuery({
    queryKey: ['employees', subsidiary.id, subsidiaryFilterId, 'paginated', page, searchTerm],
    queryFn: () => getEmployeesPaginated({ page, limit: EMPLOYEES_PAGE_SIZE, search: searchTerm || undefined, includeRelations: true, subsidiaryId: subsidiaryFilterId }),
  });

  const employees = paginatedEmployees?.data || [];
  const meta = paginatedEmployees?.meta;

  // Statistiques globales : nécessitent la liste complète (comptages exacts),
  // indépendamment de la pagination de la table ci-dessous.
  const { data: allEmployeesForStats = [] } = useQuery({
    queryKey: ['employees', subsidiary.id, subsidiaryFilterId, 'all-for-stats'],
    queryFn: () => getEmployees(false, subsidiaryFilterId),
  });

  // Tri de la page courante
  const sortedEmployees = useMemo(() => {
    const result = [...employees];
    result.sort((a, b) => {
      switch (sortMode) {
        case 'name-asc':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'name-desc':
          return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
        case 'hire-date':
          return new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime();
        case 'salary':
          return (b.baseSalary || 0) - (a.baseSalary || 0);
        default:
          return 0;
      }
    });
    return result;
  }, [employees, sortMode]);

  const filteredAndSortedEmployees = sortedEmployees;

  // Handlers
  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setIsFormModalOpen(true);
  };

  const handleSaveEmployee = async (employeeData: EmployeeFormData) => {
    try {
      const processedData = { ...employeeData };

      // Upload files if any documents contain File objects
      if (processedData.documents) {
        const documents = processedData.documents as any;
        const filesToUpload: { fieldname: string; file: File }[] = [];

        // Collect File objects to upload and delete old files
        if (hasFileObject(documents.contract)) {
          filesToUpload.push({ fieldname: 'contract', file: documents.contract.file });
          // Delete old file if editing
          if (editingEmployee?.documents?.contract?.url) {
            deleteEmployeeDocument(editingEmployee.documents.contract.url);
          }
        }
        if (hasFileObject(documents.idCard)) {
          filesToUpload.push({ fieldname: 'idCard', file: documents.idCard.file });
          if (editingEmployee?.documents?.idCard?.url) {
            deleteEmployeeDocument(editingEmployee.documents.idCard.url);
          }
        }
        if (hasFileObject(documents.workPermit)) {
          filesToUpload.push({ fieldname: 'workPermit', file: documents.workPermit.file });
          if (editingEmployee?.documents?.workPermit?.url) {
            deleteEmployeeDocument(editingEmployee.documents.workPermit.url);
          }
        }
        if (Array.isArray(documents.diplomas)) {
          documents.diplomas.forEach((diploma: any, index: number) => {
            if (hasFileObject(diploma)) {
              filesToUpload.push({ fieldname: `diplomas_${index}`, file: diploma.file });
            }
          });
        }

        // Upload files and replace File objects with URLs
        if (filesToUpload.length > 0) {
          try {
            const uploadResponse = await uploadEmployeeDocuments(filesToUpload);

            // Map uploaded URLs back to documents
            for (const uploaded of uploadResponse.uploadedFiles) {
              if (uploaded.fieldname === 'contract' && hasFileObject(documents.contract)) {
                documents.contract = { name: documents.contract.name, url: uploaded.url };
              } else if (uploaded.fieldname === 'idCard' && hasFileObject(documents.idCard)) {
                documents.idCard = { name: documents.idCard.name, url: uploaded.url };
              } else if (uploaded.fieldname === 'workPermit' && hasFileObject(documents.workPermit)) {
                documents.workPermit = { name: documents.workPermit.name, url: uploaded.url };
              } else if (uploaded.fieldname.startsWith('diplomas_')) {
                const index = parseInt(uploaded.fieldname.split('_')[1]);
                if (hasFileObject(documents.diplomas[index])) {
                  documents.diplomas[index] = { name: documents.diplomas[index].name, url: uploaded.url };
                }
              }
            }

            toast.success(t('common.success'), `${filesToUpload.length} fichier(s) uploadé(s) avec succès`);
          } catch (uploadError) {
            console.error('Error uploading files:', uploadError);
            toast.error(t('common.error'), 'Erreur lors de l\'upload des fichiers');
            throw uploadError;
          }
        }

        // Clean up any remaining File objects (shouldn't happen after upload)
        if (hasFileObject(documents.contract)) {
          documents.contract = null;
        }
        if (hasFileObject(documents.idCard)) {
          documents.idCard = null;
        }
        if (hasFileObject(documents.workPermit)) {
          documents.workPermit = null;
        }
        if (Array.isArray(documents.diplomas)) {
          documents.diplomas = documents.diplomas.filter((d: any) => !hasFileObject(d));
        }
      }

      // Save the employee with documents
      // Add ID if editing existing employee
      const saveData = editingEmployee ? { ...processedData, id: editingEmployee.id } : processedData;
      onSave(saveData);
      toast.success(t('common.success'), t('hr.employee.saved'));
      setIsFormModalOpen(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error(t('common.error'), t('hr.employee.saveFailed'));
    }
  };

  const handleDeleteEmployee = async () => {
    if (deletingEmployee) {
      try {
        await onDelete(deletingEmployee.id);
        toast.success(t('common.success'), t('hr.employee.deleted'));
        setDeletingEmployee(null);
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error(t('common.error'), t('hr.employee.deleteFailed'));
      }
    }
  };

  // L'export porte sur l'ensemble des employés (pas seulement la page
  // affichée) — on va chercher la liste complète à la demande.
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const all = await getEmployees(true);
      if (all.length === 0) {
        toast.warning(t('common.warning'), t('hr.noEmployeesToExport'));
        return;
      }
      const headers = [
        { key: 'firstName', label: t('configuration.form.firstName') },
        { key: 'lastName', label: t('configuration.form.lastName') },
        { key: 'email', label: t('common.email') },
        { key: 'department', label: t('configuration.form.department') },
        { key: 'positions', label: t('configuration.form.position') },
        { key: 'contractType', label: t('configuration.form.contractType') },
        { key: 'status', label: t('hr.table.status') },
      ];
      exportToCsv(`employees-${subsidiary.id}`, headers, all);
      toast.success(t('common.success'), t('hr.exportedCsv'));
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error(t('common.error'), t('hr.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const all = await getEmployees(true);
      if (all.length === 0) {
        toast.warning(t('common.warning'), t('hr.noEmployeesToExport'));
        return;
      }

      const headers = [
        { key: 'firstName', label: t('configuration.form.firstName') },
        { key: 'lastName', label: t('configuration.form.lastName') },
        { key: 'email', label: t('common.email') },
        { key: 'department', label: t('configuration.form.department') },
        { key: 'positions', label: t('configuration.form.position') },
        { key: 'contractType', label: t('hr.table.contract') },
        { key: 'status', label: t('hr.table.status') },
      ];
      const formattedData = all.map((e) => ({
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        department: e.department,
        positions: e.positions,
        contractType: e.contractType,
        status: e.status,
      }));
      exportToPdf(t('hr.employees.title'), headers, formattedData, `employees-${subsidiary.id}`);
      toast.success(t('common.success'), t('hr.exportedPdf'));
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(t('common.error'), t('hr.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('employeeViewMode', mode);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    localStorage.setItem('employeeSearchTerm', value);
  };

  const handleSortChange = (mode: SortMode) => {
    setSortMode(mode);
    localStorage.setItem('employeeSortMode', mode);
  };

  return (
    <div className="w-full px-1 py-2 sm:px-2 lg:px-3">
      <div className="mx-auto max-w-[1440px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{t('hr.title')}</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{t('hr.employees.title')}</h1>
            <p className="mt-1.5 text-sm text-slate-500">{t('hr.employees.directorySubtitle')}</p>
          </div>
          <Button variant="primary" size="md" className="rounded-xl px-5 py-2.5 shadow-sm" leftIcon={<Plus size={18} />} onClick={handleOpenAddModal}>
            {t('hr.employees.add')}
          </Button>
        </div>

        {/* Stats */}
        <EmployeeStats employees={allEmployeesForStats} />

        {/* Filters and Actions */}
        <Card className="!rounded-2xl !border-slate-200/80 !shadow-sm">
          <CardBody className="!p-4 sm:!p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="min-w-0 flex-1">
                <SearchBar value={searchTerm} onChange={handleSearchChange} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-600 hover:bg-slate-50" leftIcon={<BarChart size={16} />} onClick={handleExportCsv} disabled={isExporting}>
                  {t('hr.actions.csv')}
                </Button>
                <Button variant="secondary" size="sm" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-600 hover:bg-slate-50" leftIcon={<FileText size={16} />} onClick={handleExportPdf} disabled={isExporting}>
                  {t('hr.actions.pdf')}
                </Button>
                <div className="ml-auto flex gap-1 rounded-xl bg-slate-100 p-1 xl:ml-1">
                  <button
                    onClick={() => handleViewModeChange('table')}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                      viewMode === 'table'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t('hr.viewMode.table')}
                  </button>
                  <button
                    onClick={() => handleViewModeChange('cards')}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                      viewMode === 'cards'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t('hr.viewMode.cards')}
                  </button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>


        {/* Employee List - Table View */}
        {viewMode === 'table' && (
          <Card className="!overflow-hidden !rounded-2xl !border-slate-200/80 !shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t('hr.table.name')}</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Matricule</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t('hr.table.email')}</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t('hr.table.department')}</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t('hr.table.position')}</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t('hr.table.status')}</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t('hr.table.contract')}</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t('hr.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <TableSkeleton rows={EMPLOYEES_PAGE_SIZE} columns={8} />
                  ) : filteredAndSortedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState icon="inbox" title={t('hr.employees.title')} description={t('hr.noEmployeesFound')} />
                      </td>
                    </tr>
                  ) : filteredAndSortedEmployees.map((employee, idx) => (
                    <tr
                      key={employee.id}
                      className={`border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-100 text-xs font-semibold text-lime-800">{`${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase()}</span>
                          <span className="font-medium text-slate-900">{employee.firstName} {employee.lastName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{employee.id}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{employee.email}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{employee.department}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{employee.positions}</td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            employee.status === EmployeeStatus.ACTIVE
                              ? 'success'
                              : employee.status === EmployeeStatus.ON_LEAVE
                                ? 'warning'
                                : 'danger'
                          }
                          size="sm"
                          className="!font-medium"
                        >
                          {employee.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            employee.contractType === ContractType.CDI
                              ? 'success'
                              : employee.contractType === ContractType.CDD
                                ? 'warning'
                                : 'info'
                          }
                          size="sm"
                          className="!font-medium"
                        >
                          {employee.contractType}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setViewingEmployee(employee)}
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            title={t('hr.actions.view')}
                          >
                            <Eye size={18} color="currentColor" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingEmployee(employee);
                              setIsFormModalOpen(true);
                            }}
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-lime-50 hover:text-lime-800"
                            title={t('hr.actions.edit')}
                          >
                            <Edit size={18} color="currentColor" />
                          </button>
                          <button
                            onClick={() => setDeletingEmployee(employee)}
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                            title={t('hr.actions.delete')}
                          >
                            <Trash size={18} color="currentColor" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Employee List - Card View */}
        {viewMode === 'cards' && (
          isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: EMPLOYEES_PAGE_SIZE }).map((_, idx) => (
                <EmployeeCardSkeleton key={idx} />
              ))}
            </div>
          ) : filteredAndSortedEmployees.length === 0 ? (
            <Card>
              <EmptyState icon="inbox" title={t('hr.employees.title')} description={t('hr.noEmployeesFound')} />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedEmployees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onView={() => setViewingEmployee(employee)}
                  onEdit={() => {
                    setEditingEmployee(employee);
                    setIsFormModalOpen(true);
                  }}
                  onDelete={() => setDeletingEmployee(employee)}
                />
              ))}
            </div>
          )
        )}

        {meta && <Pagination meta={meta} onPageChange={setPage} />}
      </div>

      {/* Modals */}
      <EmployeeFormModalModern
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        employee={editingEmployee}
      />

      <ConfirmationModal
        isOpen={!!deletingEmployee}
        title={t('configuration.modal.deleteEmployeeTitle')}
        message={t('configuration.modal.deleteConfirmMessage', {
          itemName: `${deletingEmployee?.firstName} ${deletingEmployee?.lastName}`,
        })}
        confirmButtonText={t('common.delete')}
        isDangerous={true}
        onConfirm={handleDeleteEmployee}
        onClose={() => setDeletingEmployee(null)}
      />

      <EmployeeDetailsModalModern
        isOpen={!!viewingEmployee}
        onClose={() => setViewingEmployee(null)}
        employee={viewingEmployee}
        onEdit={(emp) => {
          setViewingEmployee(null);
          setEditingEmployee(emp);
          setIsFormModalOpen(true);
        }}
      />
    </div>
  );
};

export default EmployeeDatabaseModern;
