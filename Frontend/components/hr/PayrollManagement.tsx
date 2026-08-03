import React, { useState, useMemo } from 'react';
import { Subsidiary, PayrollRecord, PayrollStatus, Employee } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import IconSignature from '../icons/IconSignature';
import ViewSignatureModal from './ViewSignatureModal';
import PayrollDetailsModal from './PayrollDetailsModal'; // Importer la nouvelle modale
import RecordPaymentModal from './RecordPaymentModal';
import PayrollSignatureModal from './PayrollSignatureModal';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';
import IconEye from '../icons/IconEye'; // Importer l'icône pour le bouton "Détails"
import IconCreditCard from '../icons/IconCreditCard';
import { UseMutateFunction } from '@tanstack/react-query';
import SearchBar from './SearchBar';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';

interface PayrollManagementProps {
    subsidiary: Subsidiary;
    employees: Employee[];
    payrolls: PayrollRecord[];
    isLoading?: boolean;
    onProcessPayroll: UseMutateFunction<{ count: number; }, Error, { period: string; }, unknown>;
    onRecordPayment: UseMutateFunction<PayrollRecord, Error, { payrollId: string; paymentDate: string; }, unknown>;
    onSaveSignature: UseMutateFunction<PayrollRecord, Error, { payrollId: string; signature: string; }, unknown>;
}

const PayrollManagement: React.FC<PayrollManagementProps> = ({ subsidiary, employees, payrolls, isLoading = false, onProcessPayroll, onRecordPayment, onSaveSignature }) => {
    const { t, formatCurrency } = useI18n();
    const toast = useToast();
    const [viewingSignature, setViewingSignature] = useState<{name: string, signature: string} | null>(null);
    const [signingRecord, setSigningRecord] = useState<PayrollRecord | null>(null);
    const [payingRecord, setPayingRecord] = useState<PayrollRecord | null>(null);
    const [viewingDetails, setViewingDetails] = useState<PayrollRecord | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPayrolls = useMemo(() => {
        return payrolls.filter(record => {
            const searchLower = searchTerm.toLowerCase();
            return (
                record.employeeName.toLowerCase().includes(searchLower) ||
                record.period.toLowerCase().includes(searchLower)
            );
        });
    }, [payrolls, searchTerm]);

    const handleSign = (record: PayrollRecord) => {
        setSigningRecord(record);
    };

    const handleSaveSignature = (payrollId: string, signature: string) => {
        try {
            onSaveSignature({ payrollId, signature });
            toast.success('Signature enregistrée!', 'La signature a été enregistrée avec succès.');
            setSigningRecord(null);
        } catch (error) {
            toast.error('Erreur de signature', 'Une erreur est survenue lors de l\'enregistrement de la signature.');
        }
    };

    const handleConfirmPayment = (payrollId: string, paymentDate: string) => {
        try {
            onRecordPayment({ payrollId, paymentDate });
            toast.success('Paiement enregistré!', 'Le paiement a été enregistré avec succès.');
            setPayingRecord(null);
        } catch (error) {
            toast.error('Erreur de paiement', 'Une erreur est survenue lors de l\'enregistrement du paiement.');
        }
    };
    
    const handleProcessPayroll = () => {
        try {
            const currentPeriod = new Date().toISOString().slice(0, 7); // e.g., "2024-07"
            onProcessPayroll({ period: currentPeriod });
            toast.info('Traitement en cours', 'Le traitement de la paie est en cours...');
        } catch (error) {
            toast.error('Erreur de traitement', 'Une erreur est survenue lors du traitement de la paie.');
        }
    };

    const getStatusClass = (status: PayrollStatus) => {
        return status === PayrollStatus.PAID ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    };

    const handlePrint = () => {
        window.print();
        toast.info('Impression lancée', 'La page est en cours d\'impression.');
    };

    const handleExportCsv = () => {
        try {
            const headers = [
                { key: 'employeeName', label: t('hr.payroll.employee') },
                { key: 'period', label: t('hr.payroll.period') },
                { key: 'netSalary', label: t('hr.payroll.netSalary') },
                { key: 'paymentDate', label: t('hr.payroll.paymentDate') },
                { key: 'status', label: t('hr.payroll.status') },
            ];
            const data = payrolls.map(r => ({ ...r, status: t(`hr.payroll.status_${r.status}`) }));
            exportToCsv('registre_paie', headers, data);
            toast.success('Export CSV réussi!', 'Les données ont été exportées au format CSV.');
        } catch (error) {
            toast.error('Erreur d\'export', 'Une erreur est survenue lors de l\'export CSV.');
        }
    };

    const handleExportPdf = () => {
        try {
            const headers = [
                { key: 'employeeName', label: t('hr.payroll.employee') },
                { key: 'period', label: t('hr.payroll.period') },
                { key: 'netSalary', label: t('hr.payroll.netSalary') },
                { key: 'paymentDate', label: t('hr.payroll.paymentDate') },
                { key: 'status', label: t('hr.payroll.status') },
            ];
            const data = payrolls.map(r => ({ ...r, status: t(`hr.payroll.status_${r.status}`), netSalary: formatCurrency(r.netSalary) }));
            exportToPdf(t('hr.payroll.title'), headers, data, 'paie');
            toast.success('Export PDF réussi!', 'Les données ont été exportées au format PDF.');
        } catch (error) {
            toast.error('Erreur d\'export', 'Une erreur est survenue lors de l\'export PDF.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-slate-800">{t('hr.payroll.title')}</h3>
                <div className="flex items-center space-x-2 no-print">
                    <button onClick={handleProcessPayroll} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                        <span>{t('hr.payroll.process')}</span>
                    </button>
                    <button onClick={handlePrint} className="p-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors" aria-label={t('common.print')} title={t('common.print')}>
                        <IconPrint className="h-5 w-5" />
                    </button>
                    <button onClick={handleExportCsv} className="p-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors" aria-label={t('common.export')} title={t('common.export')}>
                        <IconExport className="h-5 w-5" />
                    </button>
                    <button onClick={handleExportPdf} className="p-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors" aria-label={t('common.exportPdf')} title={t('common.exportPdf')}>
                        <IconPdf className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <div className="mb-4 no-print">
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder={t('common.search') || 'Rechercher les paies...'}
                    className="max-w-md"
                />
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
                            <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <TableSkeleton rows={7} columns={7} />
                        ) : filteredPayrolls.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <EmptyState icon="finance" title={t('hr.payroll.title')} />
                                </td>
                            </tr>
                        ) : filteredPayrolls.map((record) => (
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
                                <td className="px-6 py-4 text-center space-x-1 no-print">
                                    <button onClick={() => setViewingDetails(record)} className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-100 rounded-full transition-colors" aria-label={t('common.view')}>
                                        <IconEye className="h-5 w-5" />
                                    </button>
                                    {record.status === PayrollStatus.PENDING && (
                                    <button onClick={() => setPayingRecord(record)} className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-100 rounded-full transition-colors" aria-label={t('hr.payroll.payAction')}>
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

            {viewingDetails && (
                <PayrollDetailsModal
                    isOpen={!!viewingDetails}
                    onClose={() => setViewingDetails(null)}
                    record={viewingDetails}
                />
            )}
        </div>
    );
};

export default PayrollManagement;