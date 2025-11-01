import React from 'react';
import { PayrollRecord } from '../../types';
import { useI18n } from '../../i18n';

interface PayrollDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: PayrollRecord | null;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className = '' }) => (
    <div>
        <dt className="text-sm font-medium text-slate-500">{label}</dt>
        <dd className={`mt-1 text-sm text-slate-900 font-semibold ${className}`}>{value || 'N/A'}</dd>
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

const PayrollDetailsModal: React.FC<PayrollDetailsModalProps> = ({ isOpen, onClose, record }) => {
    const { t, formatCurrency } = useI18n();

    if (!isOpen || !record) return null;

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
                    <h3 className="text-xl font-bold text-slate-900">{t('hr.payroll.detailsTitle', { period: record.period })}</h3>
                    <p className="text-slate-600">{record.employeeName}</p>
                </div>

                <div className="p-6 overflow-y-auto">
                    <Section title={t('hr.details.salaryInfo')}>
                        <DetailItem label={t('hr.details.baseSalary')} value={formatCurrency(record.baseSalary)} />
                        <DetailItem label={t('hr.payroll.grossSalary')} value={formatCurrency(record.grossSalary)} />
                        <DetailItem label={t('hr.details.bonus')} value={formatCurrency(record.bonus)} />
                    </Section>

                    <Section title={t('hr.payroll.deductions')}>
                        <DetailItem label={t('hr.payroll.socialDeductions')} value={formatCurrency(record.deductions.social)} className="text-red-600" />
                        <DetailItem label={t('hr.payroll.taxDeductions')} value={formatCurrency(record.deductions.tax)} className="text-red-600" />
                        <DetailItem label={t('hr.payroll.absenceDeductions')} value={formatCurrency(record.deductions.absences)} className="text-red-600" />
                    </Section>

                    <Section title={t('hr.payroll.summary')}>
                        <DetailItem label={t('hr.payroll.netSalary')} value={formatCurrency(record.netSalary)} className="text-green-700 text-lg" />
                        <DetailItem label={t('hr.payroll.paymentDate')} value={record.paymentDate || t('common.notAvailable')} />
                        <DetailItem label={t('hr.payroll.status')} value={t(`hr.payroll.status_${record.status}`)} />
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

export default PayrollDetailsModal;