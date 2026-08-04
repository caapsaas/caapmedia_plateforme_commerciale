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
import { getEmployees, getEmployeesPaginated, uploadDocumentFile, addDocumentToEmployee, addLeaveRecordToEmployee, saveEmployeeWithDocumentsAndLeaves } from '../../services/apihr/apiEmployees';

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
    queryKey: ['employees', subsidiary.id, 'paginated', page, searchTerm],
    queryFn: () => getEmployeesPaginated({ page, limit: EMPLOYEES_PAGE_SIZE, search: searchTerm || undefined, includeRelations: true }),
  });

  const employees = paginatedEmployees?.data || [];
  const meta = paginatedEmployees?.meta;

  // Statistiques globales : nécessitent la liste complète (comptages exacts),
  // indépendamment de la pagination de la table ci-dessous.
  const { data: allEmployeesForStats = [] } = useQuery({
    queryKey: ['employees', subsidiary.id, 'all-for-stats'],
    queryFn: () => getEmployees(),
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

      // Filter out File objects from documents (they cannot be sent as JSON)
      // Files stay local until backend file upload endpoint is implemented
      if (processedData.documents) {
        const documents = processedData.documents;

        // Keep documents with URL, discard those with File objects
        if (hasFileObject(documents.contract)) {
          toast.info(t('common.info'), t('hr.documents.fileNotYetUploaded'));
          documents.contract = null;
        }
        if (hasFileObject(documents.idCard)) {
          documents.idCard = null;
        }
        if (hasFileObject(documents.workPermit)) {
          documents.workPermit = null;
        }
        if (Array.isArray(documents.diplomas)) {
          documents.diplomas = documents.diplomas.filter((d) => !hasFileObject(d));
        }
      }

      // Save the employee with cleaned documents
      const hasLeaves = processedData.leaveRecords && Array.isArray(processedData.leaveRecords) && processedData.leaveRecords.length > 0;

      // Add ID if editing existing employee
      const saveData = editingEmployee ? { ...processedData, id: editingEmployee.id } : processedData;

      if (hasLeaves) {
        await saveEmployeeWithDocumentsAndLeaves(saveData);
        toast.success(t('common.success'), t('hr.employee.savedWithDocs'));
      } else {
        await onSave(saveData);
        toast.success(t('common.success'), t('hr.employee.saved'));
      }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('hr.employees.title')}</h1>
        </div>

        {/* Stats */}
        <EmployeeStats employees={allEmployeesForStats} />

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              <div className="flex-1">
                <SearchBar value={searchTerm} onChange={handleSearchChange} />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={handleOpenAddModal}>
                  {t('hr.employees.add')}
                </Button>
                <Button variant="secondary" leftIcon={<BarChart size={18} />} onClick={handleExportCsv} disabled={isExporting}>
                  {t('hr.actions.csv')}
                </Button>
                <Button variant="secondary" leftIcon={<FileText size={18} />} onClick={handleExportPdf} disabled={isExporting}>
                  {t('hr.actions.pdf')}
                </Button>
                <div className="flex gap-1 border border-slate-200 rounded-lg p-1">
                  <button
                    onClick={() => handleViewModeChange('table')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      viewMode === 'table'
                        ? 'bg-[#c6e911] text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t('hr.viewMode.table')}
                  </button>
                  <button
                    onClick={() => handleViewModeChange('cards')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      viewMode === 'cards'
                        ? 'bg-[#c6e911] text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100'
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
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">{t('hr.table.name')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Matricule</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">{t('hr.table.email')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">{t('hr.table.department')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">{t('hr.table.position')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">{t('hr.table.status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">{t('hr.table.salary')}</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">{t('hr.table.actions')}</th>
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
                      className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {employee.firstName} {employee.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{employee.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{employee.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{employee.department}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{employee.positions}</td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            employee.status === EmployeeStatus.ACTIVE
                              ? 'success'
                              : employee.status === EmployeeStatus.ON_LEAVE
                                ? 'warning'
                                : 'danger'
                          }
                          size="sm"
                        >
                          {employee.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {formatCurrency(Number(employee.baseSalary) || 0)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setViewingEmployee(employee)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title={t('hr.actions.view')}
                          >
                            <Eye size={18} color="currentColor" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingEmployee(employee);
                              setIsFormModalOpen(true);
                            }}
                            className="p-2 text-[#c6e911] hover:bg-[#c6e911]/10 rounded transition-colors"
                            title={t('hr.actions.edit')}
                          >
                            <Edit size={18} color="currentColor" />
                          </button>
                          <button
                            onClick={() => setDeletingEmployee(employee)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
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
