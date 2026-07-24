import React from 'react';
import { Employee, EmployeeStatus, ContractType } from '../../types';
import Badge from '../ui/Badge';
import { useI18n } from '../../i18n';

interface EmployeeFiltersProps {
  employees: Employee[];
  selectedStatus: EmployeeStatus | null;
  selectedContract: ContractType | null;
  selectedDepartment: string | null;
  onStatusChange: (status: EmployeeStatus | null) => void;
  onContractChange: (contract: ContractType | null) => void;
  onDepartmentChange: (department: string | null) => void;
  onSortChange: (sort: 'name-asc' | 'name-desc' | 'hire-date' | 'salary') => void;
}

const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  employees,
  selectedStatus,
  selectedContract,
  selectedDepartment,
  onStatusChange,
  onContractChange,
  onDepartmentChange,
  onSortChange,
}) => {
  const { t } = useI18n();

  const departments = [...new Set(employees.map((e) => e.department))].sort();
  const statuses = Object.values(EmployeeStatus);
  const contracts = Object.values(ContractType);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedStatus === null ? 'primary' : 'default'}
              size="sm"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onStatusChange(null)}
            >
              All
            </Badge>
            {statuses.map((status) => (
              <Badge
                key={status}
                variant={selectedStatus === status ? 'primary' : 'default'}
                size="sm"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onStatusChange(selectedStatus === status ? null : status)}
              >
                {status}
              </Badge>
            ))}
          </div>
        </div>

        {/* Contract Filter */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Contract</label>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedContract === null ? 'primary' : 'default'}
              size="sm"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onContractChange(null)}
            >
              All
            </Badge>
            {contracts.map((contract) => (
              <Badge
                key={contract}
                variant={selectedContract === contract ? 'primary' : 'default'}
                size="sm"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onContractChange(selectedContract === contract ? null : contract)}
              >
                {contract}
              </Badge>
            ))}
          </div>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
          <select
            value={selectedDepartment || ''}
            onChange={(e) => onDepartmentChange(e.target.value || null)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#c6e911] focus:ring-2 focus:ring-[#c6e911]/20"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Sort By</label>
          <select
            onChange={(e) => onSortChange(e.target.value as any)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#c6e911] focus:ring-2 focus:ring-[#c6e911]/20"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="hire-date">Hire Date</option>
            <option value="salary">Salary</option>
          </select>
        </div>

        {/* View Toggle */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">View</label>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-[#c6e911] text-slate-800 rounded font-semibold text-sm hover:bg-[#adc40f]">
              📋 Table
            </button>
            <button className="flex-1 px-3 py-2 bg-slate-200 text-slate-700 rounded font-semibold text-sm hover:bg-slate-300">
              📇 Cards
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(selectedStatus || selectedContract || selectedDepartment) && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600 mb-2">Active filters:</p>
          <div className="flex gap-2 flex-wrap">
            {selectedStatus && (
              <Badge variant="primary" size="sm">
                {selectedStatus} ✕
              </Badge>
            )}
            {selectedContract && (
              <Badge variant="primary" size="sm">
                {selectedContract} ✕
              </Badge>
            )}
            {selectedDepartment && (
              <Badge variant="primary" size="sm">
                {selectedDepartment} ✕
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeFilters;
