import React, { useState } from 'react';
import { MOCK_PAYROLL, MOCK_EMPLOYEES } from '../../constants';
import { Subsidiary, PayrollRecord, PayrollStatus } from '../../types';
import { useI18n } from '../../i18n';
import IconSignature from '../icons/IconSignature';
import ViewSignatureModal from './ViewSignatureModal';
import PayrollSignatureModal from './PayrollSignatureModal';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';

interface PayrollManagementProps {
    subsidiary: Subsidiary;
}

const PayrollManagement: React.FC<PayrollManagementProps> = ({ subsidiary }) => {
    const { t, formatCurrency } = useI18n();
    const [payrollRecords, setPayrollRecords] = useState(MOCK_PAYROLL.filter(p => p.subsidiaryId === subsidiary.id));
    const [viewingSignature, setViewingSignature] = useState<{name: string, signature: string} | null>(null);
    const [signingRecord, setSigningRecord] = useState<PayrollRecord | null>(null);

    const handleSign = (record: PayrollRecord) => {
        setSigningRecord(record);
    };

    const handleSaveSignature = (recordId: string, signature: string) => {
        setPayrollRecords(prev => prev.map(rec => 
            rec.id === recordId ? { ...rec, signature, paymentDate: new Date().toISOString().split('T')[0], status: PayrollStatus.PAID } : rec
        ));
        setSigningRecord(null);
    };
    
    const processPayroll = () => {
        // Mock function to process payroll for employees not yet paid this month
        const currentPeriod = new Date().toISOString().slice(0, 7); // e.g., "2024-07"
        const employeesToPay = MOCK_EMPLOYEES.filter(emp => 
            emp.subsidiaryId === subsidiary.id &&
            !payrollRecords.some(pr => pr.employeeId === emp.id && pr.period === currentPeriod)
        );

        const newPayrollRecords: PayrollRecord[] = employeesToPay.map(emp => {
            const deductions = emp.baseSalary * 0.1; // 10% mock deduction
            return {
                id: `PAY-${Date.now()}-${emp.id}`,
                employeeId: emp.id,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                period: currentPeriod,
                grossSalary: emp.baseSalary,
                deductions: deductions,
                netSalary: emp.baseSalary - deductions,
                paymentDate: null,
                status: PayrollStatus.PENDING,
                signature: null,
                subsidiaryId: subsidiary.id,
            };
        });

        setPayrollRecords(prev => [...prev, ...newPayrollRecords]);
        alert(`${newPayrollRecords.length} new payroll records generated for ${currentPeriod}.`);
    };

    const getStatusClass = (status: PayrollStatus) => {
        return status === PayrollStatus.PAID ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    };

    const handlePrint = () => window.print();

    const handleExportCsv = () => {
        const headers = [
            { key: 'employeeName', label: t('hr.payroll.employee') },
            { key: 'period', label: t('hr.payroll.period') },
            { key: 'netSalary', label: t('hr.payroll.netSalary') },
            { key: 'paymentDate', label: t('hr.payroll.paymentDate') },
            { key: 'status', label: t('hr.payroll.status') },
        ];
        const data = payrollRecords.map(r => ({ ...r, status: t(`hr.payroll.status_${r.status}`) }));
        exportToCsv('registre_paie', headers, data);
    };

    const handleExportPdf = () => {
        const headers = [
            { key: 'employeeName', label: t('hr.payroll.employee') },
            { key: 'period', label: t('hr.payroll.period') },
            { key: 'netSalary', label: t('hr.payroll.netSalary') },
            { key: 'paymentDate', label: t('hr.payroll.paymentDate') },
            { key: 'status', label: t('hr.payroll.status') },
        ];
        const data = payrollRecords.map(r => ({ ...r, status: t(`hr.payroll.status_${r.status}`), netSalary: formatCurrency(r.netSalary) }));
        exportToPdf(t('hr.payroll.title'), headers, data, 'paie');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('hr.payroll.title')}</h3>
                <div className="flex items-center space-x-2 no-print">
                    <button onClick={processPayroll} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                        <span>{t('hr.payroll.process')}</span>
                    </button>
                    <button onClick={handlePrint} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        <IconPrint className="h-4 w-4" />
                        <span>{t('common.print')}</span>
                    </button>
                    <button onClick={handleExportCsv} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        <IconExport className="h-4 w-4" />
                        <span>{t('common.export')}</span>
                    </button>
                    <button onClick={handleExportPdf} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        <IconPdf className="h-4 w-4" />
                        <span>{t('common.exportPdf')}</span>
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('hr.payroll.employee')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.payroll.period')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('hr.payroll.netSalary')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.payroll.paymentDate')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('hr.payroll.status')}</th>
                            <th scope="col" className="px-6 py-3 text-center no-print">{t('hr.payroll.signature')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrollRecords.map((record) => (
                            <tr key={record.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{record.employeeName}</td>
                                <td className="px-6 py-4">{record.period}</td>
                                <td className="px-6 py-4 text-right font-bold text-slate-800">{formatCurrency(record.netSalary)}</td>
                                <td className="px-6 py-4">{record.paymentDate || 'N/A'}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(record.status)}`}>
                                        {t(`hr.payroll.status_${record.status}`)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center no-print">
                                    {record.signature ? (
                                        <button onClick={() => setViewingSignature({name: record.employeeName, signature: record.signature!})} className="flex items-center mx-auto space-x-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-md hover:bg-green-200 transition-colors">
                                            <IconSignature className="h-4 w-4" />
                                            <span>{t('common.view')}</span>
                                        </button>
                                    ) : (
                                        <button onClick={() => handleSign(record)} className="px-4 py-2 bg-blue-500 text-white text-xs font-semibold rounded-md hover:bg-blue-600 transition-colors">
                                            {t('hr.payroll.sign')}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {viewingSignature && (
                <ViewSignatureModal 
                    isOpen={!!viewingSignature}
                    onClose={() => setViewingSignature(null)}
                    signatureUrl={viewingSignature.signature}
                    name={viewingSignature.name}
                />
            )}

            {signingRecord && (
                <PayrollSignatureModal
                    isOpen={!!signingRecord}
                    onClose={() => setSigningRecord(null)}
                    onSaveSignature={handleSaveSignature}
                    record={signingRecord}
                />
            )}
        </div>
    );
};

export default PayrollManagement;