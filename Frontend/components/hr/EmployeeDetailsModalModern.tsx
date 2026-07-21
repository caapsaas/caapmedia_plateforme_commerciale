import React, { useState } from 'react';
import { Employee } from '../../types';
import { useI18n } from '../../i18n';
import Card, { CardBody, CardHeader } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Edit, User, Briefcase, DollarSign, Umbrella, Globe, FileText, Card as CardIcon, Award, Shield, X } from '../ui/Icons';
import LeaveBalanceWidget from './LeaveBalanceWidget';
import CameroonPayrollWidget from './CameroonPayrollWidget';

interface EmployeeDetailsModalModernProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onEdit?: (employee: Employee) => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.FC<any>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const ChevronDown = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 flex items-center justify-between transition-all duration-200"
      >
        <span className="font-semibold text-slate-900 flex items-center gap-2.5 text-sm">
          <div className="p-1.5 bg-gradient-to-br from-[#c6e911]/20 to-[#c6e911]/10 rounded-lg">
            <Icon size={16} color="#c6e911" />
          </div>
          {title}
        </span>
        <ChevronDown
          size={18}
          className={`text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-5 py-3 bg-white/50 border-t border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-start py-3 px-3 rounded-lg hover:bg-slate-50 transition-colors">
    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-semibold text-slate-900 text-right ml-4">{value || '—'}</span>
  </div>
);

const EmployeeDetailsModalModern: React.FC<EmployeeDetailsModalModernProps> = ({
  isOpen,
  onClose,
  employee,
  onEdit,
}) => {
  const { t, formatCurrency } = useI18n();

  if (!isOpen || !employee) return null;

  const calculateYearsOfService = (hireDate: string | Date): number => {
    try {
      const hire = new Date(hireDate);
      const today = new Date();

      if (isNaN(hire.getTime())) return 0;

      let years = today.getFullYear() - hire.getFullYear();
      const monthDiff = today.getMonth() - hire.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hire.getDate())) {
        years--;
      }

      return Math.max(0, years);
    } catch (error) {
      return 0;
    }
  };

  const yearsOfService = calculateYearsOfService(employee.hireDate);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 overflow-y-auto backdrop-blur-sm">
      <Card className="w-full max-w-4xl my-8 shadow-2xl transform transition-all animate-in fade-in zoom-in-95 rounded-3xl overflow-hidden">
        {/* Header with Summary */}
        <div className="bg-gradient-to-br from-[#c6e911] via-[#b8dd0a] to-[#adc40f] px-6 py-6 text-slate-900 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-white to-white/80 flex items-center justify-center font-bold text-2xl shadow-lg ring-4 ring-white/30">
                  {employee.firstName.charAt(0)}
                  {employee.lastName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {employee.firstName} {employee.lastName}
                  </h2>
                  <p className="text-slate-800 text-sm font-semibold mt-0.5 flex items-center gap-2">
                    <Briefcase size={16} />
                    {employee.positions}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {onEdit && (
                  <Button variant="secondary" onClick={() => onEdit(employee)} leftIcon={<Edit size={16} />}>
                    {t('hr.actions.edit')}
                  </Button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-slate-900"
                  title={t('common.close')}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <p className="text-xs font-bold opacity-85 uppercase tracking-wide">{t('hr.details.status')}</p>
                <p className="text-base font-bold mt-1 text-slate-900">{t(`hr.employeeStatus.${employee.status}`)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <p className="text-xs font-bold opacity-85 uppercase tracking-wide">{t('hr.details.contractType')}</p>
                <p className="text-base font-bold mt-1 text-slate-900">{t(`hr.contractType.${employee.contractType}`)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <p className="text-xs font-bold opacity-85 uppercase tracking-wide">{t('hr.details.yearsOfService')}</p>
                <p className="text-base font-bold mt-1 text-slate-900">{yearsOfService}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <p className="text-xs font-bold opacity-85 uppercase tracking-wide">{t('hr.details.email')}</p>
                <p className="text-xs font-semibold mt-1 text-slate-900 truncate">{employee.email}</p>
              </div>
            </div>
          </div>
        </div>

        <CardBody className="max-h-[60vh] overflow-y-auto space-y-3">
          {/* Personal Information */}
          <CollapsibleSection title={t('hr.details.personalInfo')} icon={User} defaultOpen>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <DetailRow label={t('hr.details.firstName')} value={employee.firstName} />
                <DetailRow label={t('hr.details.lastName')} value={employee.lastName} />
                <DetailRow label={t('hr.details.birthDate')} value={new Date(employee.birthDate).toLocaleDateString()} />
                <DetailRow label={t('configuration.form.gender')} value={t(`hr.gender.${employee.gender}`)} />
              </div>
              <div className="space-y-3">
                <DetailRow label={t('hr.details.nationality')} value={employee.nationality} />
                <DetailRow label={t('hr.details.phone')} value={employee.phone} />
                <DetailRow label={t('hr.details.email')} value={employee.email} />
                <DetailRow label={t('hr.details.address')} value={employee.address} />
              </div>
            </div>
          </CollapsibleSection>

          {/* Professional Information */}
          <CollapsibleSection title={t('hr.details.professionalInfo')} icon={Briefcase} defaultOpen>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <DetailRow label={t('hr.details.department')} value={employee.department} />
                <DetailRow label={t('hr.details.position')} value={employee.positions} />
                <DetailRow label={t('hr.details.workLocation')} value={employee.workLocation} />
                <DetailRow label={t('hr.details.hireDate')} value={new Date(employee.hireDate).toLocaleDateString()} />
              </div>
              <div className="space-y-3">
                <DetailRow label={t('hr.details.contractType')} value={t(`hr.contractType.${employee.contractType}`)} />
                <DetailRow label={t('hr.details.status')} value={<Badge variant="primary">{t(`hr.employeeStatus.${employee.status}`)}</Badge>} />
                <DetailRow label={t('hr.details.yearsOfService')} value={yearsOfService} />
              </div>
            </div>
          </CollapsibleSection>

          {/* Salary Information */}
          <CollapsibleSection title={t('hr.details.salary')} icon={DollarSign} defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <DetailRow
                  label={t('hr.details.baseSalary')}
                  value={typeof employee.baseSalary === 'number' ? formatCurrency(employee.baseSalary) : formatCurrency(Number(employee.baseSalary) || 0)}
                />
                <DetailRow
                  label={t('hr.details.bonus')}
                  value={typeof employee.bonus === 'number' ? formatCurrency(employee.bonus) : formatCurrency(Number(employee.bonus) || 0)}
                />
                <DetailRow label={t('hr.details.paymentMethod')} value={employee.paymentMethod ? t(`hr.paymentMethod.${employee.paymentMethod}`) : t('common.notAvailable')} />
              </div>
              <div className="space-y-3">
                <DetailRow
                  label={t('hr.details.lastSalaryAdjustment')}
                  value={
                    employee.lastSalaryAdjustmentDate
                      ? new Date(employee.lastSalaryAdjustmentDate).toLocaleDateString()
                      : t('common.notAvailable')
                  }
                />
                {employee.benefits && employee.benefits.length > 0 && (
                  <DetailRow
                    label={t('hr.details.benefits')}
                    value={employee.benefits.join(', ')}
                  />
                )}
              </div>
            </div>

            {/* Banking Details */}
            {(employee.bankName || employee.bankAccountNumber) && (
              <div className="mt-4 p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200 shadow-sm">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <CardIcon size={16} />
                  {t('hr.details.bankAccount')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.bankName && (
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">{t('hr.details.bankName')}</p>
                      <p className="text-sm font-semibold text-blue-900 mt-1">{employee.bankName}</p>
                    </div>
                  )}
                  {employee.bankAccountNumber && (
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">{t('hr.details.bankAccountNumber')}</p>
                      <p className="text-sm font-mono font-semibold text-blue-900 mt-1">{employee.bankAccountNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cameroon Payroll Widget */}
            <div className="mt-6">
              <CameroonPayrollWidget
                baseSalary={employee.baseSalary || 0}
                bonus={employee.bonus || 0}
                numberDependents={employee.numberDependents || 0}
              />
            </div>
          </CollapsibleSection>

          {/* Leave Information */}
          <CollapsibleSection title={t('hr.details.leaveEntitlements')} icon={Umbrella} defaultOpen={true}>
            {employee.leaveBalance && (
              <LeaveBalanceWidget
                leaveBalance={
                  typeof employee.leaveBalance === 'object'
                    ? (employee.leaveBalance as any)
                    : {
                        annual: 0,
                        sick: 0,
                        personal: 0,
                        maternity: 0,
                        paternity: 0,
                        other: 0,
                        unpaid: 0,
                      }
                }
              />
            )}
          </CollapsibleSection>

          {/* Leave Records */}
          {employee.leaveRecords && employee.leaveRecords.length > 0 && (
            <CollapsibleSection title={t('hr.details.leaveHistory')} icon={Umbrella} defaultOpen={true}>
              <div className="space-y-2">
                {employee.leaveRecords.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{t(`hr.leaveType.${record.leaveRecordType}`)}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {new Date(record.startDate).toLocaleDateString()} - {new Date(record.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{record.days} jours</p>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Position History */}
          {employee.positionHistory && employee.positionHistory.length > 0 && (
            <CollapsibleSection title={t('hr.details.positionHistory')} icon={Briefcase} defaultOpen={true}>
              <div className="space-y-2">
                {employee.positionHistory.map((history, index) => (
                  <div key={index} className="border-l-4 border-[#c6e911] pl-4 py-3">
                    <p className="text-sm font-bold text-slate-900">{history.position}</p>
                    <p className="text-xs text-slate-600 mt-1">{history.department}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(history.startDate).toLocaleDateString()}
                      {history.endDate ? ` - ${new Date(history.endDate).toLocaleDateString()}` : ' - Actuel'}
                    </p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Trainings */}
          {employee.trainings && employee.trainings.length > 0 && (
            <CollapsibleSection title={t('hr.details.trainings')} icon={Award} defaultOpen={true}>
              <div className="space-y-2">
                {employee.trainings.map((training, index) => (
                  <div key={index} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-bold text-slate-900">{training.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{training.provider}</p>
                    <p className="text-xs text-slate-500 mt-2">{new Date(training.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Performance Reviews */}
          {employee.performanceReviews && employee.performanceReviews.length > 0 && (
            <CollapsibleSection title={t('hr.details.performanceReviews')} icon={Shield} defaultOpen={true}>
              <div className="space-y-2">
                {employee.performanceReviews.map((review, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">{t('hr.details.reviewer')}</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{review.reviewer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">{t('hr.details.rating')}</p>
                        <div className="flex gap-1 mt-1 justify-end">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-slate-300'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">{new Date(review.date).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-700">{review.comments}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}


          {/* Documents */}
          {employee.documents && (
            <CollapsibleSection title={t('hr.details.documents')} icon={FileText} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employee.documents.contract && (
                  <div className="border border-blue-200 rounded-lg p-4 flex items-start gap-3 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{t('hr.details.contract')}</p>
                      <p className="text-xs text-slate-600 mt-1 truncate">{employee.documents.contract.name}</p>
                    </div>
                  </div>
                )}
                {employee.documents.idCard && (
                  <div className="border border-purple-200 rounded-lg p-4 flex items-start gap-3 bg-purple-50/50 hover:bg-purple-50 transition-colors">
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <CardIcon size={20} className="text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{t('hr.details.idCard')}</p>
                      <p className="text-xs text-slate-600 mt-1 truncate">{employee.documents.idCard.name}</p>
                    </div>
                  </div>
                )}
                {employee.documents.workPermit && (
                  <div className="border border-green-200 rounded-lg p-4 flex items-start gap-3 bg-green-50/50 hover:bg-green-50 transition-colors">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <Shield size={20} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{t('hr.details.workPermit')}</p>
                      <p className="text-xs text-slate-600 mt-1 truncate">{employee.documents.workPermit.name}</p>
                    </div>
                  </div>
                )}
                {employee.documents.diplomas && employee.documents.diplomas.length > 0 && (
                  <div className="border border-amber-200 rounded-lg p-4 flex items-start gap-3 bg-amber-50/50 hover:bg-amber-50 transition-colors">
                    <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                      <Award size={20} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{t('hr.details.diplomas')}</p>
                      <p className="text-xs text-slate-600 mt-1">{employee.documents.diplomas.length} document(s)</p>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default EmployeeDetailsModalModern;
