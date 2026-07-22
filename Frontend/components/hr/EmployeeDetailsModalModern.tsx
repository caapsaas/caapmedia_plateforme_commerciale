import React, { useState, useEffect } from 'react';
import { Employee } from '../../types';
import { useI18n } from '../../i18n';
import Card, { CardBody, CardHeader } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Edit, User, Briefcase, DollarSign, Umbrella, Globe, FileText, Card as CardIcon, Award, Shield, X, Download } from '../ui/Icons';
import LeaveBalanceWidget from './LeaveBalanceWidget';
import CameroonPayrollWidget from './CameroonPayrollWidget';
import { getEmployeeWithRelations } from '../../services/apihr/apiEmployees';
import { useToast } from '../../context/ToastContext';

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
  const toast = useToast();
  const [employeeData, setEmployeeData] = useState<Employee | null>(employee);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les données complètes de l'employé quand la modale s'ouvre
  useEffect(() => {
    if (isOpen && employee?.id) {
      setIsLoading(true);
      getEmployeeWithRelations(employee.id)
        .then((fullEmployee) => {
          console.log('Employee data loaded:', {
            id: fullEmployee.id,
            name: `${fullEmployee.firstName} ${fullEmployee.lastName}`,
            hasDocuments: !!fullEmployee.documents,
            hasLeaveBalance: !!fullEmployee.leaveBalance,
            leaveBalance: fullEmployee.leaveBalance,
            documents: fullEmployee.documents,
          });
          setEmployeeData(fullEmployee);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error loading employee details:', error);
          toast.error('Erreur', 'Impossible de charger les détails de l\'employé');
          setEmployeeData(employee);
          setIsLoading(false);
        });
    }
  }, [isOpen, employee?.id, toast]);

  if (!isOpen || !employeeData) return null;

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

  const yearsOfService = calculateYearsOfService(employeeData.hireDate);

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
                  {employeeData.firstName.charAt(0)}
                  {employeeData.lastName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {employeeData.firstName} {employeeData.lastName}
                  </h2>
                  <p className="text-slate-800 text-sm font-semibold mt-0.5 flex items-center gap-2">
                    <Briefcase size={16} />
                    {employeeData.positions}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {onEdit && (
                  <Button variant="secondary" onClick={() => onEdit(employeeData)} leftIcon={<Edit size={16} />}>
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
                <p className="text-base font-bold mt-1 text-slate-900">{t(`hr.employeeStatus.${employeeData.status}`)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <p className="text-xs font-bold opacity-85 uppercase tracking-wide">{t('hr.details.contractType')}</p>
                <p className="text-base font-bold mt-1 text-slate-900">{t(`hr.contractType.${employeeData.contractType}`)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <p className="text-xs font-bold opacity-85 uppercase tracking-wide">{t('hr.details.yearsOfService')}</p>
                <p className="text-base font-bold mt-1 text-slate-900">{yearsOfService}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <p className="text-xs font-bold opacity-85 uppercase tracking-wide">{t('hr.details.email')}</p>
                <p className="text-xs font-semibold mt-1 text-slate-900 truncate">{employeeData.email}</p>
              </div>
            </div>
          </div>
        </div>

        <CardBody className="max-h-[60vh] overflow-y-auto space-y-3">
          {/* Personal Information */}
          <CollapsibleSection title={t('hr.details.personalInfo')} icon={User} defaultOpen>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <DetailRow label={t('hr.details.firstName')} value={employeeData.firstName} />
                <DetailRow label={t('hr.details.lastName')} value={employeeData.lastName} />
                <DetailRow label={t('hr.details.birthDate')} value={new Date(employeeData.birthDate).toLocaleDateString()} />
                <DetailRow label={t('configuration.form.gender')} value={t(`hr.gender.${employeeData.gender}`)} />
              </div>
              <div className="space-y-3">
                <DetailRow label={t('hr.details.nationality')} value={employeeData.nationality} />
                <DetailRow label={t('hr.details.phone')} value={employeeData.phone} />
                <DetailRow label={t('hr.details.email')} value={employeeData.email} />
                <DetailRow label={t('hr.details.address')} value={employeeData.address} />
              </div>
            </div>
          </CollapsibleSection>

          {/* Professional Information */}
          <CollapsibleSection title={t('hr.details.professionalInfo')} icon={Briefcase} defaultOpen>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <DetailRow label={t('hr.details.department')} value={employeeData.department} />
                <DetailRow label={t('hr.details.position')} value={employeeData.positions} />
                <DetailRow label={t('hr.details.workLocation')} value={employeeData.workLocation} />
                <DetailRow label={t('hr.details.hireDate')} value={new Date(employeeData.hireDate).toLocaleDateString()} />
              </div>
              <div className="space-y-3">
                <DetailRow label={t('hr.details.contractType')} value={t(`hr.contractType.${employeeData.contractType}`)} />
                <DetailRow label={t('hr.details.status')} value={<Badge variant="primary">{t(`hr.employeeStatus.${employeeData.status}`)}</Badge>} />
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
                  value={typeof employeeData.baseSalary === 'number' ? formatCurrency(employeeData.baseSalary) : formatCurrency(Number(employeeData.baseSalary) || 0)}
                />
                <DetailRow
                  label={t('hr.details.bonus')}
                  value={typeof employeeData.bonus === 'number' ? formatCurrency(employeeData.bonus) : formatCurrency(Number(employeeData.bonus) || 0)}
                />
                <DetailRow label={t('hr.details.paymentMethod')} value={employeeData.paymentMethod ? t(`hr.paymentMethod.${employeeData.paymentMethod}`) : t('common.notAvailable')} />
              </div>
              <div className="space-y-3">
                <DetailRow
                  label={t('hr.details.lastSalaryAdjustment')}
                  value={
                    employeeData.lastSalaryAdjustmentDate
                      ? new Date(employeeData.lastSalaryAdjustmentDate).toLocaleDateString()
                      : t('common.notAvailable')
                  }
                />
                {employeeData.benefits && employeeData.benefits.length > 0 && (
                  <DetailRow
                    label={t('hr.details.benefits')}
                    value={employeeData.benefits.join(', ')}
                  />
                )}
              </div>
            </div>

            {/* Banking Details */}
            {(employeeData.bankName || employeeData.bankAccountNumber) && (
              <div className="mt-4 p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200 shadow-sm">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <CardIcon size={16} />
                  {t('hr.details.bankAccount')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employeeData.bankName && (
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">{t('hr.details.bankName')}</p>
                      <p className="text-sm font-semibold text-blue-900 mt-1">{employeeData.bankName}</p>
                    </div>
                  )}
                  {employeeData.bankAccountNumber && (
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">{t('hr.details.bankAccountNumber')}</p>
                      <p className="text-sm font-mono font-semibold text-blue-900 mt-1">{employeeData.bankAccountNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cameroon Payroll Widget */}
            <div className="mt-6">
              <CameroonPayrollWidget
                baseSalary={employeeData.baseSalary || 0}
                bonus={employeeData.bonus || 0}
                numberDependents={employeeData.numberDependents || 0}
              />
            </div>
          </CollapsibleSection>

          {/* Leave Information */}
          <CollapsibleSection title={t('hr.details.leaveEntitlements')} icon={Umbrella} defaultOpen={true}>
            {isLoading ? (
              <div className="text-center py-4">
                <p className="text-sm text-slate-600">Chargement des congés...</p>
              </div>
            ) : employeeData?.leaveBalance ? (
              <LeaveBalanceWidget
                leaveBalance={
                  typeof employeeData.leaveBalance === 'object'
                    ? (employeeData.leaveBalance as any)
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
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-600">Pas de données de congés disponibles</p>
              </div>
            )}
          </CollapsibleSection>

          {/* Leave Records */}
          {employeeData.leaveRecords && employeeData.leaveRecords.length > 0 && (
            <CollapsibleSection title={t('hr.details.leaveHistory')} icon={Umbrella} defaultOpen={true}>
              <div className="space-y-2">
                {employeeData.leaveRecords.map((record, index) => (
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
          {employeeData.positionHistory && employeeData.positionHistory.length > 0 && (
            <CollapsibleSection title={t('hr.details.positionHistory')} icon={Briefcase} defaultOpen={true}>
              <div className="space-y-2">
                {employeeData.positionHistory.map((history, index) => (
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
          {employeeData.trainings && employeeData.trainings.length > 0 && (
            <CollapsibleSection title={t('hr.details.trainings')} icon={Award} defaultOpen={true}>
              <div className="space-y-2">
                {employeeData.trainings.map((training, index) => (
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
          {employeeData.performanceReviews && employeeData.performanceReviews.length > 0 && (
            <CollapsibleSection title={t('hr.details.performanceReviews')} icon={Shield} defaultOpen={true}>
              <div className="space-y-2">
                {employeeData.performanceReviews.map((review, index) => (
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
          <CollapsibleSection title={t('hr.details.documents')} icon={FileText} defaultOpen={true}>
            {isLoading ? (
              <div className="text-center py-4">
                <p className="text-sm text-slate-600">Chargement des documents...</p>
              </div>
            ) : employeeData?.documents ? (
              <div className="space-y-3">
                {/* Contract */}
                {employeeData.documents.contract && (
                  <div className="border border-blue-200 rounded-lg p-4 flex items-center justify-between bg-blue-50/50 hover:bg-blue-50 transition-colors group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <FileText size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{t('hr.details.contract')}</p>
                        <p className="text-xs text-slate-600 mt-0.5 truncate">{employeeData.documents.contract.name}</p>
                      </div>
                    </div>
                    {employeeData.documents.contract.url && (
                      <a
                        href={employeeData.documents.contract.url}
                        download={employeeData.documents.contract.name}
                        className="ml-2 p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                        title="Télécharger"
                      >
                        <Download size={18} />
                      </a>
                    )}
                  </div>
                )}

                {/* ID Card */}
                {employeeData.documents.idCard && (
                  <div className="border border-purple-200 rounded-lg p-4 flex items-center justify-between bg-purple-50/50 hover:bg-purple-50 transition-colors group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                        <CardIcon size={20} className="text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{t('hr.details.idCard')}</p>
                        <p className="text-xs text-slate-600 mt-0.5 truncate">{employeeData.documents.idCard.name}</p>
                      </div>
                    </div>
                    {employeeData.documents.idCard.url && (
                      <a
                        href={employeeData.documents.idCard.url}
                        download={employeeData.documents.idCard.name}
                        className="ml-2 p-2 text-purple-600 hover:bg-purple-100 rounded transition-colors flex-shrink-0"
                        title="Télécharger"
                      >
                        <Download size={18} />
                      </a>
                    )}
                  </div>
                )}

                {/* Work Permit */}
                {employeeData.documents.workPermit && (
                  <div className="border border-green-200 rounded-lg p-4 flex items-center justify-between bg-green-50/50 hover:bg-green-50 transition-colors group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                        <Shield size={20} className="text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{t('hr.details.workPermit')}</p>
                        <p className="text-xs text-slate-600 mt-0.5 truncate">{employeeData.documents.workPermit.name}</p>
                      </div>
                    </div>
                    {employeeData.documents.workPermit.url && (
                      <a
                        href={employeeData.documents.workPermit.url}
                        download={employeeData.documents.workPermit.name}
                        className="ml-2 p-2 text-green-600 hover:bg-green-100 rounded transition-colors flex-shrink-0"
                        title="Télécharger"
                      >
                        <Download size={18} />
                      </a>
                    )}
                  </div>
                )}

                {/* Diplomas */}
                {employeeData.documents.diplomas && employeeData.documents.diplomas.length > 0 && (
                  <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                        <Award size={20} className="text-amber-600" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {t('hr.details.diplomas')} ({employeeData.documents.diplomas.length})
                      </p>
                    </div>
                    <div className="space-y-2 ml-10">
                      {employeeData.documents.diplomas.map((diploma, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-amber-100 hover:border-amber-200 transition-colors">
                          <p className="text-xs font-medium text-slate-700 truncate flex-1">{diploma.name}</p>
                          {diploma.url && (
                            <a
                              href={diploma.url}
                              download={diploma.name}
                              className="ml-2 p-1 text-amber-600 hover:bg-amber-100 rounded transition-colors flex-shrink-0"
                              title="Télécharger"
                            >
                              <Download size={16} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!employeeData.documents.contract && !employeeData.documents.idCard && !employeeData.documents.workPermit && (!employeeData.documents.diplomas || employeeData.documents.diplomas.length === 0) && (
                  <div className="p-4 text-center bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-600">Aucun document n'a été ajouté pour cet employé.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-600">Pas de documents disponibles</p>
              </div>
            )}
            </CollapsibleSection>
        </CardBody>
      </Card>
    </div>
  );
};

export default EmployeeDetailsModalModern;
