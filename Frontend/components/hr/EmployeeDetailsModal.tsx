import React from 'react';
import { Employee } from '../../types';
import { useI18n } from '../../i18n';

interface EmployeeDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-slate-500">{label}</dt>
        <dd className="mt-1 text-sm text-slate-900 font-semibold">{value || 'N/A'}</dd>
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h4 className="text-lg font-bold text-[#c6e911] border-b border-slate-200 pb-2 mb-3">{title}</h4>
        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
            {children}
        </dl>
    </div>
);

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({ isOpen, onClose, employee }) => {
    const { t, formatCurrency } = useI18n();

    if (!isOpen || !employee) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-slate-900">{t('configuration.modal.employeeDetailsTitle')}</h3>
                    <p className="text-slate-600">{employee.firstName} {employee.lastName}</p>
                </div>

                <div className="p-6 overflow-y-auto">
                    {/* Personal Info */}
                    <Section title={t('hr.details.personalInfo')}>
                        <DetailItem label={t('hr.details.lastName')} value={employee.lastName} />
                        <DetailItem label={t('hr.details.firstName')} value={employee.firstName} />
                        <DetailItem label={t('hr.details.birthDate')} value={employee.birthDate} />
                        <DetailItem label={t('hr.details.gender')} value={t(`hr.gender.${employee.gender}`)} />
                        <DetailItem label={t('hr.details.nationality')} value={employee.nationality} />
                        <DetailItem label={t('hr.details.ssn')} value={employee.socialSecurityNumber} />
                        <DetailItem label={t('hr.details.phone')} value={employee.phone} />
                        <DetailItem label={t('hr.details.email')} value={employee.email} />
                        <DetailItem label={t('hr.details.address')} value={employee.address} />
                    </Section>
                    
                    {/* Professional Info */}
                    <Section title={t('hr.details.professionalInfo')}>
                        <DetailItem label={t('hr.details.position')} value={employee.positions} />
                        <DetailItem label={t('hr.details.department')} value={employee.department} />
                        <DetailItem label={t('hr.details.hireDate')} value={employee.hireDate} />
                        <DetailItem label={t('hr.details.contractType')} value={t(`hr.contractType.${employee.contractType}`)} />
                        <DetailItem label={t('hr.details.status')} value={t(`hr.employeeStatus.${employee.status}`)} />
                        <DetailItem label={t('hr.details.workLocation')} value={employee.workLocation} />
                        <DetailItem label={t('hr.details.manager')} value={employee.managerId || t('hr.details.none')} />
                    </Section>

                    {/* Salary Info */}
                    <Section title={t('hr.details.salaryInfo')}>
                        <DetailItem label={t('hr.details.baseSalary')} value={formatCurrency(employee.baseSalary)} />
                        <DetailItem label={t('hr.details.bonus')} value={formatCurrency(employee.bonus)} />
                        <DetailItem label={t('hr.details.benefits')} value={employee.benefits.join(', ') || t('hr.details.none')} />
                        <DetailItem label={t('hr.details.paymentMethod')} value={t(`hr.paymentMethod.${employee.paymentMethod}`)} />
                        <DetailItem label={t('hr.details.lastSalaryAdjustment')} value={employee.lastSalaryAdjustmentDate || t('hr.details.notApplicable')} />
                    </Section>

                     {/* Documents */}
                    <Section title={t('hr.details.documents')}>
                        <DetailItem label={t('hr.details.contract')} value={employee.documents.contract?.name || t('hr.details.noDocument')} />
                        <DetailItem label={t('hr.details.idCard')} value={employee.documents.idCard?.name || t('hr.details.noDocument')} />
                        <DetailItem label={t('hr.details.workPermit')} value={employee.documents.workPermit?.name || t('hr.details.notApplicable')} />
                        <DetailItem label={t('hr.details.diplomas')} value={employee.documents.diplomas.map(d => d.name).join(', ') || t('hr.details.none')} />
                    </Section>

                     {/* Leave Info */}
                    <Section title={t('hr.details.leaveInfo')}>
                        <DetailItem label={t('hr.details.leaveBalance')} value={`${employee.leaveBalance} jours`} />
                    </Section>

                </div>
                
                <div className="px-6 py-4 bg-slate-50 border-t flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 transition-colors"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailsModal;