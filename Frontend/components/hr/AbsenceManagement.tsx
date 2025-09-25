import React, { useState } from 'react';
import { MOCK_ABSENCES, MOCK_EMPLOYEES } from '../../constants';
import { Subsidiary, AbsenceRecord, AbsenceType } from '../../types';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import IconDownload from '../icons/IconDownload';
import AbsenceFormModal from './AbsenceFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';

interface AbsenceManagementProps {
    subsidiary: Subsidiary;
}

const AbsenceManagement: React.FC<AbsenceManagementProps> = ({ subsidiary }) => {
    const { t } = useI18n();
    const [absenceRecords, setAbsenceRecords] = useState(MOCK_ABSENCES.filter(a => a.subsidiaryId === subsidiary.id));
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingAbsence, setEditingAbsence] = useState<AbsenceRecord | null>(null);
    const [deletingAbsence, setDeletingAbsence] = useState<AbsenceRecord | null>(null);

    const handleOpenAddModal = () => {
        setEditingAbsence(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (absence: AbsenceRecord) => {
        setEditingAbsence(absence);
        setIsFormModalOpen(true);
    };

    const handleOpenDeleteModal = (absence: AbsenceRecord) => {
        setDeletingAbsence(absence);
    };

    const handleCloseModals = () => {
        setIsFormModalOpen(false);
        setDeletingAbsence(null);
        setEditingAbsence(null);
    };

    const handleSaveAbsence = (absenceData: Omit<AbsenceRecord, 'id' | 'subsidiaryId' | 'employeeName'>) => {
        const employee = MOCK_EMPLOYEES.find(e => e.id === absenceData.employeeId);
        if (!employee) return;

        const employeeName = `${employee.firstName} ${employee.lastName}`;
        
        if (editingAbsence) {
            setAbsenceRecords(absences => absences.map(a => 
                a.id === editingAbsence.id ? { ...editingAbsence, ...absenceData, employeeName } : a
            ));
        } else {
            const newAbsence: AbsenceRecord = {
                ...absenceData,
                id: `ABS${Date.now()}`,
                employeeName,
                subsidiaryId: subsidiary.id,
            };
            setAbsenceRecords(prev => [newAbsence, ...prev]);
        }
        handleCloseModals();
    };

    const handleDeleteAbsence = () => {
        if (deletingAbsence) {
            setAbsenceRecords(absences => absences.filter(a => a.id !== deletingAbsence.id));
            handleCloseModals();
        }
    };

    const getTypeClass = (type: AbsenceType) => {
        return type === AbsenceType.JUSTIFIED ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    const handlePrint = () => window.print();

    const handleExportCsv = () => {
        const headers = [
            { key: 'employeeName', label: t('hr.absences.table.employee') },
            { key: 'type', label: t('hr.absences.table.type') },
            { key: 'startDate', label: t('hr.absences.table.startDate') },
            { key: 'endDate', label: t('hr.absences.table.endDate') },
            { key: 'reason', label: t('hr.absences.table.reason') },
        ];
        const data = absenceRecords.map(r => ({ ...r, type: t(`hr.absenceType.${r.type}`) }));
        exportToCsv('registre_absences', headers, data);
    };

    const handleExportPdf = () => {
        const headers = [
            { key: 'employeeName', label: t('hr.absences.table.employee') },
            { key: 'type', label: t('hr.absences.table.type') },
            { key: 'startDate', label: t('hr.absences.table.startDate') },
            { key: 'endDate', label: t('hr.absences.table.endDate') },
            { key: 'reason', label: t('hr.absences.table.reason') },
        ];
        const data = absenceRecords.map(r => ({ ...r, type: t(`hr.absenceType.${r.type}`) }));
        exportToPdf(t('hr.absences.title'), headers, data, 'absences');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('hr.absences.title')}</h3>
                <div className="flex items-center space-x-2 no-print">
                    <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                        <IconPlus className="h-4 w-4" />
                        <span>{t('hr.absences.add')}</span>
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
                            <th scope="col" className="px-6 py-3">{t('hr.absences.table.employee')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.absences.table.type')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.absences.table.startDate')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.absences.table.endDate')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.absences.table.reason')}</th>
                            <th scope="col" className="px-6 py-3 text-center no-print">{t('hr.absences.table.document')}</th>
                            <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {absenceRecords.map((record) => (
                            <tr key={record.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{record.employeeName}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeClass(record.type)}`}>
                                        {t(`hr.absenceType.${record.type}`)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{record.startDate}</td>
                                <td className="px-6 py-4">{record.endDate}</td>
                                <td className="px-6 py-4 max-w-xs truncate">{record.reason}</td>
                                <td className="px-6 py-4 text-center no-print">
                                    {record.documentUrl ? (
                                        <a href={record.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 px-3 py-1 bg-sky-100 text-sky-700 text-xs font-semibold rounded-md hover:bg-sky-200 transition-colors">
                                            <IconDownload className="h-4 w-4" />
                                            <span>{t('hr.absences.table.download')}</span>
                                        </a>
                                    ) : (
                                        <span className="text-xs text-slate-400">{t('hr.absences.table.noDocument')}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center space-x-1 no-print">
                                    <button onClick={() => handleOpenEditModal(record)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                        <IconEdit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenDeleteModal(record)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
                                        <IconDelete className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && (
                <AbsenceFormModal
                    isOpen={isFormModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSaveAbsence}
                    absence={editingAbsence}
                    subsidiary={subsidiary}
                />
            )}

            {deletingAbsence && (
                <ConfirmationModal
                    isOpen={!!deletingAbsence}
                    onClose={handleCloseModals}
                    onConfirm={handleDeleteAbsence}
                    title={t('configuration.modal.deleteAbsenceTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: `${t('hr.absences.title')} for ${deletingAbsence.employeeName}` })}
                />
            )}
        </div>
    );
};

export default AbsenceManagement;