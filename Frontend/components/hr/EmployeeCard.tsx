import React from 'react';
import { Employee, ContractType, EmployeeStatus } from '../../types';
import Badge from '../ui/Badge';
import { useI18n } from '../../i18n';
import { Eye, Edit, Trash } from '../ui/Icons';

interface EmployeeCardProps {
  employee: Employee;
  onEdit?: (employee: Employee) => void;
  onView?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
}

const getStatusColor = (status: EmployeeStatus): 'success' | 'warning' | 'danger' | 'default' => {
  switch (status) {
    case EmployeeStatus.ACTIVE:
      return 'success';
    case EmployeeStatus.ON_LEAVE:
      return 'warning';
    case EmployeeStatus.RESIGNED:
    case EmployeeStatus.TERMINATED:
      return 'danger';
    default:
      return 'default';
  }
};

const getContractColor = (contract: ContractType): 'info' | 'primary' | 'default' => {
  switch (contract) {
    case ContractType.CDI:
      return 'primary';
    case ContractType.CDD:
      return 'info';
    default:
      return 'default';
  }
};

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onEdit, onView, onDelete }) => {
  const { t, formatCurrency } = useI18n();

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4">
      {/* Header with Avatar */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#c6e911] to-[#adc40f] flex items-center justify-center font-bold text-slate-800">
            {getInitials(employee.firstName, employee.lastName)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-sm text-slate-600">{employee.positions}</p>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Badge variant={getStatusColor(employee.status)} size="sm">
          {employee.status}
        </Badge>
        <Badge variant={getContractColor(employee.contractType)} size="sm">
          {employee.contractType}
        </Badge>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-4 pb-4 border-b border-slate-200">
        <div>
          <p className="text-slate-600 text-xs uppercase font-semibold">{t('configuration.form.department')}</p>
          <p className="text-slate-900 font-medium">{employee.department}</p>
        </div>
        <div>
          <p className="text-slate-600 text-xs uppercase font-semibold">{t('hr.table.salary')}</p>
          <p className="text-slate-900 font-medium">
            {typeof employee.baseSalary === 'number'
              ? formatCurrency(employee.baseSalary)
              : formatCurrency(Number(employee.baseSalary) || 0)}
          </p>
        </div>
        <div>
          <p className="text-slate-600 text-xs uppercase font-semibold">{t('configuration.form.email')}</p>
          <p className="text-slate-900 font-medium text-xs truncate">{employee.email}</p>
        </div>
        <div>
          <p className="text-slate-600 text-xs uppercase font-semibold">{t('configuration.form.phone')}</p>
          <p className="text-slate-900 font-medium">{employee.phone}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        {onView && (
          <button
            onClick={() => onView(employee)}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1.5"
            title={t('hr.actions.view')}
          >
            <Eye size={16} />
            {t('hr.actions.view')}
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(employee)}
            className="px-3 py-1.5 text-sm font-medium text-[#c6e911] hover:bg-[#c6e911]/10 rounded transition-colors flex items-center gap-1.5"
            title={t('hr.actions.edit')}
          >
            <Edit size={16} />
            {t('hr.actions.edit')}
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(employee)}
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-1.5"
            title={t('hr.actions.delete')}
          >
            <Trash size={16} />
            {t('hr.actions.delete')}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmployeeCard;
