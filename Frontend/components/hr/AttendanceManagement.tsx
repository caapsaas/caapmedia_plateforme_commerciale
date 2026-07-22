import React, { useState, useMemo } from 'react';
import { Subsidiary, AttendanceRecord, AttendanceStatus, Employee } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import IconPlus from '../icons/IconPlus';
import IconSignature from '../icons/IconSignature';
import ViewSignatureModal from './ViewSignatureModal';
import AttendanceActionModal from './AttendanceActionModal';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import { formatDateTime } from '../../utils/dateFormatter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';
import { UseMutateFunction } from '@tanstack/react-query';
import SignaturePad from '../common/SignaturePad';
import SearchBar from './SearchBar';
import IconUsers from '../icons/IconUsers';

interface AttendanceManagementProps {
    subsidiary: Subsidiary;
    employees: Employee[];
    attendances: AttendanceRecord[];
    onSave: UseMutateFunction<AttendanceRecord, Error, Partial<AttendanceRecord>, unknown>;
}

const AttendanceManagement: React.FC<AttendanceManagementProps> = ({ subsidiary, employees, attendances, onSave }) => {
    const { t } = useI18n();
    const toast = useToast();
    const [viewingSignature, setViewingSignature] = useState<{name: string, signature: string} | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [signingEmployee, setSigningEmployee] = useState<{employee: Employee, type: 'arrival' | 'departure'} | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEmployees = useMemo(() => {
        return employees.filter(employee => {
            const searchLower = searchTerm.toLowerCase();
            return (
                employee.firstName.toLowerCase().includes(searchLower) ||
                employee.lastName.toLowerCase().includes(searchLower) ||
                employee.positions.toLowerCase().includes(searchLower)
            );
        });
    }, [employees, searchTerm]);

    const filteredAttendances = useMemo(() => {
        return attendances.filter(record => {
            const searchLower = searchTerm.toLowerCase();
            return record.employeeName.toLowerCase().includes(searchLower);
        });
    }, [attendances, searchTerm]);

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = attendances.filter(r => new Date(r.attendanceDate).toISOString().split('T')[0] === today);
        const present = todayRecords.filter(r => r.arrivalTime && r.departureTime).length;
        const atWork = todayRecords.filter(r => r.arrivalTime && !r.departureTime).length;
        const absent = filteredEmployees.length - present - atWork;

        return { present, atWork, absent, total: filteredEmployees.length };
    }, [attendances, filteredEmployees]);

    const getStatusClass = (status: AttendanceStatus) => {
        switch (status) {
            case 'PRESENT': return 'bg-green-100 text-green-800';
            case 'ABSENT_JUSTIFIED': return 'bg-yellow-100 text-yellow-800';
            case 'ABSENT_UNJUSTIFIED': return 'bg-red-100 text-red-800';
            case 'HOLIDAY': return 'bg-blue-100 text-blue-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    // Get today's attendance for each employee
    const todayAttendance = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const attendanceMap = new Map<string, AttendanceRecord>();
        
        attendances.forEach(record => {
            const recordDate = new Date(record.attendanceDate).toISOString().split('T')[0];
            if (recordDate === today) {
                attendanceMap.set(record.employeeId, record);
            }
        });
        
        return attendanceMap;
    }, [attendances]);

    const getEmployeeStatus = (employee: Employee) => {
        const attendance = todayAttendance.get(employee.id);
        if (!attendance) return 'NOT_ARRIVED';
        if (attendance.arrivalTime && !attendance.departureTime) return 'AT_WORK';
        if (attendance.arrivalTime && attendance.departureTime) return 'DEPARTED';
        return 'NOT_ARRIVED';
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'AT_WORK': return 'bg-green-100 text-green-800';
            case 'DEPARTED': return 'bg-blue-100 text-blue-800';
            case 'NOT_ARRIVED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'AT_WORK': return 'Au travail';
            case 'DEPARTED': return 'Parti';
            case 'NOT_ARRIVED': return 'Pas encore arrivé';
            default: return status;
        }
    };
    
    const handleSaveAttendance = (record: Partial<AttendanceRecord>) => {
        try {
            onSave(record);
            toast.success('Présence enregistrée!', 'La présence a été enregistrée avec succès.');
            setIsActionModalOpen(false);
        } catch (error) {
            toast.error('Erreur de sauvegarde', 'Une erreur est survenue lors de la sauvegarde de la présence.');
        }
    };

    const handleArrivalSignature = (employee: Employee) => {
        setSigningEmployee({ employee, type: 'arrival' });
    };

    const handleDepartureSignature = (employee: Employee) => {
        setSigningEmployee({ employee, type: 'departure' });
    };

    const handleSignatureSave = (signature: string) => {
        if (!signingEmployee) return;

        const { employee, type } = signingEmployee;
        const today = new Date().toISOString().split('T')[0];
        const existingAttendance = todayAttendance.get(employee.id);
        const now = new Date().toISOString();

        let attendanceRecord: Partial<AttendanceRecord>;

        if (existingAttendance) {
            // Update existing record
            attendanceRecord = {
                id: existingAttendance.id,
                employeeId: employee.id,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                attendanceDate: new Date(today).toISOString(),
                status: AttendanceStatus.PRESENT,
                arrivalTime: existingAttendance.arrivalTime,
                departureTime: type === 'departure' ? now : existingAttendance.departureTime,
                breakStartTime: existingAttendance.breakStartTime,
                breakEndTime: existingAttendance.breakEndTime,
                signature: signature,
                subsidiaryId: subsidiary.id,
            };
        } else {
            // Create new record
            attendanceRecord = {
                employeeId: employee.id,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                attendanceDate: new Date(today).toISOString(),
                status: AttendanceStatus.PRESENT,
                arrivalTime: type === 'arrival' ? now : null,
                departureTime: type === 'departure' ? now : null,
                signature,
                subsidiaryId: subsidiary.id,
            };
        }

        handleSaveAttendance(attendanceRecord);
        setSigningEmployee(null);
    };

    const handlePrint = () => {
        window.print();
        toast.info('Impression lancée', 'La page est en cours d\'impression.');
    };

    const handleExportCsv = () => {
        try {
            const headers = [
                { key: 'employeeName', label: t('hr.attendance.employee') },
                { key: 'date', label: t('hr.attendance.date') },
                { key: 'status', label: t('hr.attendance.status') },
                { key: 'arrivalTime', label: t('hr.attendance.arrivalTime') },
                { key: 'departureTime', label: t('hr.attendance.departureTime') },
            ];
            const data = attendances.map(r => ({ ...r, status: t(`hr.attendance.status_${r.status}`) }));
            exportToCsv('registre_presences', headers, data);
            toast.success('Export CSV réussi!', 'Les données ont été exportées au format CSV.');
        } catch (error) {
            toast.error('Erreur d\'export', 'Une erreur est survenue lors de l\'export CSV.');
        }
    };

    const handleExportPdf = () => {
        try {
            const headers = [
                { key: 'employeeName', label: t('hr.attendance.employee') },
                { key: 'date', label: t('hr.attendance.date') },
                { key: 'status', label: t('hr.attendance.status') },
                { key: 'arrivalTime', label: t('hr.attendance.arrivalTime') },
                { key: 'departureTime', label: t('hr.attendance.departureTime') },
            ];
            const data = attendances.map(r => ({ ...r, status: t(`hr.attendance.status_${r.status}`) }));
            exportToPdf(t('hr.attendance.title'), headers, data, 'presences');
            toast.success('Export PDF réussi!', 'Les données ont été exportées au format PDF.');
        } catch (error) {
            toast.error('Erreur d\'export', 'Une erreur est survenue lors de l\'export PDF.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-slate-900">{t('hr.attendance.title')}</h1>
                    <div className="flex items-center space-x-2 no-print">
                        <button onClick={() => setIsActionModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                            <IconPlus className="h-4 w-4" />
                            <span>{t('hr.attendance.record')}</span>
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
                <div className="no-print">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder={t('common.search') || 'Rechercher les employés...'}
                        className="max-w-md"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Présents</p>
                            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                        </div>
                        <div className="text-green-100">
                            <IconUsers className="h-10 w-10" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Au travail</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.atWork}</p>
                        </div>
                        <div className="text-blue-100">
                            <IconUsers className="h-10 w-10" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Absents</p>
                            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                        </div>
                        <div className="text-red-100">
                            <IconUsers className="h-10 w-10" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-slate-400">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Total</p>
                            <p className="text-2xl font-bold text-slate-700">{stats.total}</p>
                        </div>
                        <div className="text-slate-200">
                            <IconUsers className="h-10 w-10" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Attendance Section */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-1">Pointage du jour</h2>
                    <p className="text-sm text-slate-500">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEmployees.map((employee) => {
                        const status = getEmployeeStatus(employee);
                        const attendance = todayAttendance.get(employee.id);

                        return (
                            <div key={employee.id} className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-lg transition-all duration-200">
                                {/* Employee Header */}
                                <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-900 text-sm">
                                            {employee.firstName} {employee.lastName}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1">{employee.positions}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${getStatusBadgeClass(status)}`}>
                                        {getStatusText(status)}
                                    </span>
                                </div>

                                {/* Times Display */}
                                <div className="space-y-2 mb-4">
                                    {attendance?.arrivalTime ? (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600">Arrivée</span>
                                            <span className="font-semibold text-slate-900">{new Date(attendance.arrivalTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600">Arrivée</span>
                                            <span className="text-slate-400">--:--</span>
                                        </div>
                                    )}
                                    {attendance?.departureTime ? (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600">Départ</span>
                                            <span className="font-semibold text-slate-900">{new Date(attendance.departureTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600">Départ</span>
                                            <span className="text-slate-400">--:--</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    {status !== 'AT_WORK' && status !== 'DEPARTED' && (
                                        <button
                                            onClick={() => handleArrivalSignature(employee)}
                                            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-md transition-colors border border-green-200"
                                        >
                                            <IconSignature className="h-4 w-4" />
                                            <span>Pointer l'arrivée</span>
                                        </button>
                                    )}

                                    {status === 'AT_WORK' && (
                                        <button
                                            onClick={() => handleDepartureSignature(employee)}
                                            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-md transition-colors border border-red-200"
                                        >
                                            <IconSignature className="h-4 w-4" />
                                            <span>Pointer le départ</span>
                                        </button>
                                    )}

                                    {status === 'DEPARTED' && (
                                        <div className="w-full px-3 py-2.5 bg-slate-50 text-slate-600 text-sm font-medium rounded-md text-center">
                                            Journée complète
                                        </div>
                                    )}

                                    {attendance?.signature && (
                                        <button
                                            onClick={() => setViewingSignature({name: `${employee.firstName} ${employee.lastName}`, signature: attendance.signature})}
                                            className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md transition-colors"
                                        >
                                            Voir signature
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Attendance History Section */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-1">Historique des présences</h2>
                    <p className="text-sm text-slate-500">Enregistrements détaillés des pointages</p>
                </div>
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
                        {filteredAttendances.map((record) => (
                            <tr key={record.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{record.employeeName}</td>
                                <td className="px-6 py-4">{formatDateTime(record.attendanceDate)}</td>
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

            {signingEmployee && (
                <SignaturePad
                    onSave={handleSignatureSave}
                    onClose={() => setSigningEmployee(null)}
                    title={`Signature - ${signingEmployee.type === 'arrival' ? 'Arrivée' : 'Départ'} de ${signingEmployee.employee.firstName} ${signingEmployee.employee.lastName}`}
                    clearLabel="Effacer"
                    saveLabel="Signer"
                />
            )}

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