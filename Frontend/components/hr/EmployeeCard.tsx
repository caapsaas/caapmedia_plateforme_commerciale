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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      {/* Header with Avatar */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-100 text-sm font-semibold text-lime-800">
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
      <div className="mb-4 grid grid-cols-2 gap-3 border-b border-slate-100 pb-4 text-sm">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{t('configuration.form.department')}</p>
          <p className="text-slate-900 font-medium">{employee.department}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{t('hr.table.salary')}</p>
          <p className="text-slate-900 font-medium">
            {typeof employee.baseSalary === 'number'
              ? formatCurrency(employee.baseSalary)
              : formatCurrency(Number(employee.baseSalary) || 0)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{t('configuration.form.email')}</p>
          <p className="text-slate-900 font-medium text-xs truncate">{employee.email}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{t('configuration.form.phone')}</p>
          <p className="text-slate-900 font-medium">{employee.phone}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        {onView && (
          <button
            onClick={() => onView(employee)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            title={t('hr.actions.view')}
          >
            <Eye size={16} />
            {t('hr.actions.view')}
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(employee)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-lime-50 hover:text-lime-800"
            title={t('hr.actions.edit')}
          >
            <Edit size={16} />
            {t('hr.actions.edit')}
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(employee)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
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
