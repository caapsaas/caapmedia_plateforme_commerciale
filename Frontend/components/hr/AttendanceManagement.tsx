import React, { useState } from 'react';
import { Subsidiary, AttendanceRecord, AttendanceStatus, Employee } from '../../types';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import IconSignature from '../icons/IconSignature';
import ViewSignatureModal from './ViewSignatureModal';
import AttendanceActionModal from './AttendanceActionModal';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';
import { UseMutateFunction } from '@tanstack/react-query';

interface AttendanceManagementProps {
    subsidiary: Subsidiary;
    employees: Employee[];
    attendances: AttendanceRecord[];
    onSave: UseMutateFunction<AttendanceRecord, Error, Partial<AttendanceRecord>, unknown>;
}

const AttendanceManagement: React.FC<AttendanceManagementProps> = ({ subsidiary, employees, attendances, onSave }) => {
    const { t } = useI18n();
    const [viewingSignature, setViewingSignature] = useState<{name: string, signature: string} | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    const getStatusClass = (status: AttendanceStatus) => {
        switch (status) {
            case 'PRESENT': return 'bg-green-100 text-green-800';
            case 'ABSENT_JUSTIFIED': return 'bg-yellow-100 text-yellow-800';
            case 'ABSENT_UNJUSTIFIED': return 'bg-red-100 text-red-800';
            case 'HOLIDAY': return 'bg-blue-100 text-blue-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };
    
    const handleSaveAttendance = (record: Partial<AttendanceRecord>) => {
        onSave(record);
        setIsActionModalOpen(false);
    };

    const handlePrint = () => window.print();

    const handleExportCsv = () => {
        const headers = [
            { key: 'employeeName', label: t('hr.attendance.employee') },
            { key: 'date', label: t('hr.attendance.date') },
            { key: 'status', label: t('hr.attendance.status') },
            { key: 'arrivalTime', label: t('hr.attendance.arrivalTime') },
            { key: 'departureTime', label: t('hr.attendance.departureTime') },
        ];
        const data = attendances.map(r => ({ ...r, status: t(`hr.attendance.status_${r.status}`) }));
        exportToCsv('registre_presences', headers, data);
    };

    const handleExportPdf = () => {
        const headers = [
            { key: 'employeeName', label: t('hr.attendance.employee') },
            { key: 'date', label: t('hr.attendance.date') },
            { key: 'status', label: t('hr.attendance.status') },
            { key: 'arrivalTime', label: t('hr.attendance.arrivalTime') },
            { key: 'departureTime', label: t('hr.attendance.departureTime') },
        ];
        const data = attendances.map(r => ({ ...r, status: t(`hr.attendance.status_${r.status}`) }));
        exportToPdf(t('hr.attendance.title'), headers, data, 'presences');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('hr.attendance.title')}</h3>
                <div className="flex items-center space-x-2 no-print">
                    <button onClick={() => setIsActionModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                        <IconPlus className="h-4 w-4" />
                        <span>{t('hr.attendance.record')}</span>
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
                            <th scope="col" className="px-6 py-3">{t('hr.attendance.employee')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.attendance.date')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.attendance.status')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.attendance.arrivalTime')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.attendance.breakTime')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.attendance.departureTime')}</th>
                            <th scope="col" className="px-6 py-3 text-center no-print">{t('hr.attendance.signature')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendances.map((record) => (
                            <tr key={record.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{record.employeeName}</td>
                                <td className="px-6 py-4">{record.date}</td>
                                <td className="px-6 py-4">
                                     <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(record.status)}`}>
                                        {t(`hr.attendance.status_${record.status}`)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{record.arrivalTime || 'N/A'}</td>
                                <td className="px-6 py-4">{record.breakStartTime ? `${record.breakStartTime} - ${record.breakEndTime}` : 'N/A'}</td>
                                <td className="px-6 py-4">{record.departureTime || 'N/A'}</td>
                                <td className="px-6 py-4 text-center no-print">
                                    {record.signature ? (
                                        <button onClick={() => setViewingSignature({name: record.employeeName, signature: record.signature!})} className="flex items-center mx-auto space-x-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-md hover:bg-green-200 transition-colors">
                                            <IconSignature className="h-4 w-4" />
                                            <span>{t('hr.attendance.viewSignature')}</span>
                                        </button>
                                    ) : (
                                        <span className="text-xs text-red-500">{t('hr.attendance.notSigned')}</span>
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

            {isActionModalOpen && (
                <AttendanceActionModal
                    isOpen={isActionModalOpen}
                    onClose={() => setIsActionModalOpen(false)}
                    onSave={handleSaveAttendance}
                    employees={employees}
                    subsidiary={subsidiary}
                />
            )}
        </div>
    );
};

export default AttendanceManagement;