import React, { useState, useMemo } from 'react';
import { Subsidiary, Employee, EmployeeFormData, ContractType, EmployeeStatus } from '../../types';
import { UseMutateFunction } from '@tanstack/react-query';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../common/ConfirmationModal';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import SearchBar from './SearchBar';
import { uploadDocumentFile, addDocumentToEmployee, addLeaveRecordToEmployee, saveEmployeeWithDocumentsAndLeaves } from '../../services/apihr/apiEmployees';

// New UI Components
import Card, { CardBody, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Plus, BarChart, FileText, Eye, Edit, Trash } from '../ui/Icons';
import EmployeeStats from './EmployeeStats';
import EmployeeFilters from './EmployeeFilters';
import EmployeeCard from './EmployeeCard';
import EmployeeFormModalModern from './EmployeeFormModalModern';
import EmployeeDetailsModalModern from './EmployeeDetailsModalModern';

interface EmployeeDatabaseModernProps {
  subsidiary: Subsidiary;
  employees: Employee[];
  onSave: UseMutateFunction<Employee, Error, Partial<Employee>, unknown>;
  onDelete: UseMutateFunction<Employee, Error, string, unknown>;
  isLoading?: boolean;
}

type ViewMode = 'table' | 'cards';
type SortMode = 'name-asc' | 'name-desc' | 'hire-date' | 'salary';

const hasFileObject = (obj: any): boolean => {
  return obj && typeof obj === 'object' && 'file' in obj;
};

const EmployeeDatabaseModern: React.FC<EmployeeDatabaseModernProps> = ({
  subsidiary,
  employees,
  onSave,
  onDelete,
  isLoading = false,
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

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Filtered and sorted employees
  const filteredAndSortedEmployees = useMemo(() => {
    let result = employees.filter((employee) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        employee.firstName.toLowerCase().includes(searchLower) ||
        employee.lastName.toLowerCase().includes(searchLower) ||
        employee.email.toLowerCase().includes(searchLower) ||
        employee.phone.toLowerCase().includes(searchLower) ||
        employee.positions.toLowerCase().includes(searchLower) ||
        employee.department.toLowerCase().includes(searchLower);

      return matchesSearch;
    });

    // Sort
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
  }, [employees, searchTerm, sortMode]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setIsFormModalOpen(true);
  };

  const handleSaveEmployee = async (employeeData: Partial<Employee>) => {
    try {
      const documents = employeeData.documents;
      const hasFilesToUpload = documents && (
        hasFileObject(documents.contract) ||
        hasFileObject(documents.idCard) ||
        hasFileObject(documents.workPermit) ||
        (Array.isArray(documents.diplomas) && documents.diplomas.some(hasFileObject))
      );

      const hasLeaves = employeeData.leaveRecords && Array.isArray(employeeData.leaveRecords) && employeeData.leaveRecords.length > 0;

      if (hasFilesToUpload || hasLeaves) {
        await saveEmployeeWithDocumentsAndLeaves(employeeData);
        toast.success(t('common.success'), t('hr.employee.savedWithDocs'));
      } else {
        await onSave(employeeData);
        toast.success(t('common.success'), t('hr.employee.saved'));
      }
      setIsFormModalOpen(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error(t('common.error'), t('hr.employee.saveFailed'));
    }

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

  const handleExportCsv = () => {
    try {
      if (filteredAndSortedEmployees.length === 0) {
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
      exportToCsv(`employees-${subsidiary.id}`, headers, filteredAndSortedEmployees);
      toast.success(t('common.success'), t('hr.exportedCsv'));
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error(t('common.error'), t('hr.exportFailed'));
    }
  };

  const handleExportPdf = () => {
    try {
      if (filteredAndSortedEmployees.length === 0) {
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
      const formattedData = filteredAndSortedEmployees.map((e) => ({
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
        <EmployeeStats employees={employees} />

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
                <Button variant="secondary" leftIcon={<BarChart size={18} />} onClick={handleExportCsv}>
                  {t('hr.actions.csv')}
                </Button>
                <Button variant="secondary" leftIcon={<FileText size={18} />} onClick={handleExportPdf}>
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">{t('hr.table.email')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">{t('hr.table.department')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">{t('hr.table.position')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">{t('hr.table.status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">{t('hr.table.salary')}</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">{t('hr.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedEmployees.map((employee, idx) => (
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
        )}

        {!isLoading && filteredAndSortedEmployees.length === 0 && (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-slate-500 text-lg">{t('hr.noEmployeesFound')}</p>
            </CardBody>
          </Card>
        )}
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
