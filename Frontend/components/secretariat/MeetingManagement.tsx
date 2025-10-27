import React, { useState } from 'react';
import { Subsidiary, Meeting, Employee } from '../../types';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import IconEye from '../icons/IconEye';
import MeetingFormModal from './MeetingFormModal';
import MeetingDetailsModal from './MeetingDetailsModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';
import { SaveMeetingDto } from '../../services/apisecretariat/apiSecretariat';

interface MeetingManagementProps {
    subsidiary: Subsidiary;
    meetings: Meeting[];
    employees: Employee[];
    onSave: (data: SaveMeetingDto) => void;
    onDelete: (id: string) => void;
}

const MeetingManagement: React.FC<MeetingManagementProps> = ({ subsidiary, meetings, employees, onSave, onDelete }) => {
    const { t } = useI18n();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
    const [viewingMeeting, setViewingMeeting] = useState<Meeting | null>(null);
    const [deletingMeeting, setDeletingMeeting] = useState<Meeting | null>(null);

    const formatDate = (isoString?: string | Date) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(); // ou date.toISOString().split('T')[0] pour YYYY-MM-DD
};

const formatTime = (isoString?: string | Date) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};


    const handleOpenAddModal = () => {
        setEditingMeeting(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (meeting: Meeting) => {
        setEditingMeeting(meeting);
        setIsFormModalOpen(true);
    };
    
    const handleOpenViewModal = (meeting: Meeting) => {
        setViewingMeeting(meeting);
    }
    
    const handleOpenDeleteModal = (meeting: Meeting) => {
        setDeletingMeeting(meeting);
    };

    const handleCloseModals = () => {
        setIsFormModalOpen(false);
        setViewingMeeting(null);
        setDeletingMeeting(null);
    };

    const handleSaveMeeting = (data: SaveMeetingDto) => {
        onSave(data);
        handleCloseModals();
    };
    
    const handleSaveMinutes = (meetingId: string, minutes: string) => {
        onSave({ id: meetingId, minutes });
    };

    const handleDeleteMeeting = () => {
        if (deletingMeeting) {
            onDelete(deletingMeeting.id);
            handleCloseModals();
        }
    };
    
    const getParticipantNames = (participants: { employee: Employee }[]) => {
        if (!participants || participants.length === 0) return 'Aucun participant';
        return participants.map(p => p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : 'Employé inconnu').join(', ');
    };

    const handlePrint = () => window.print();

    const handleExportCsv = () => {
        const headers = [
            { key: 'title', label: t('secretariat.meetings.table.title') },
            { key: 'date', label: t('secretariat.meetings.table.date') },
            { key: 'location', label: t('secretariat.meetings.table.location') },
            { key: 'participants', label: t('secretariat.meetings.table.participants') },
        ];
        const data = meetings.map(m => ({
            ...m,
            date: `${m.date} - ${m.time}`,
            participants: getParticipantNames(m.participants),
        }));
        exportToCsv('liste_reunions', headers, data);
    };

    const handleExportPdf = () => {
        const headers = [
            { key: 'title', label: t('secretariat.meetings.table.title') },
            { key: 'date', label: t('secretariat.meetings.table.date') },
            { key: 'location', label: t('secretariat.meetings.table.location') },
        ];
         const data = meetings.map(m => ({
            ...m,
            date: `${m.date} - ${m.time}`,
        }));
        exportToPdf(t('secretariat.meetings.title'), headers, data, 'reunions');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('secretariat.meetings.title')}</h3>
                <div className="flex items-center space-x-2 no-print">
                    <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                        <IconPlus className="h-4 w-4" />
                        <span>{t('secretariat.meetings.add')}</span>
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
                            <th scope="col" className="px-6 py-3">{t('secretariat.meetings.table.title')}</th>
                            <th scope="col" className="px-6 py-3">{t('secretariat.meetings.table.date')}</th>
                            <th scope="col" className="px-6 py-3">{t('secretariat.meetings.table.location')}</th>
                            <th scope="col" className="px-6 py-3">{t('secretariat.meetings.table.participants')}</th>
                            <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {meetings.map((meeting) => (
                            <tr key={meeting.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{meeting.title}</td>
                                <td className="px-6 py-4">{`${formatDate(meeting.meetingDate)} - ${formatTime(meeting.meetingTime)}`}</td>

                                <td className="px-6 py-4">{meeting.meetingLocation}</td>
                                <td className="px-6 py-4 max-w-sm truncate">{getParticipantNames(meeting.participants)}</td>
                                <td className="px-6 py-4 text-center space-x-1 no-print">
                                    <button onClick={() => handleOpenViewModal(meeting)} className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-100 rounded-full transition-colors" aria-label={t('common.view')}>
                                        <IconEye className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenEditModal(meeting)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                        <IconEdit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenDeleteModal(meeting)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
                                        <IconDelete className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && (
                <MeetingFormModal 
                    isOpen={isFormModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSaveMeeting}
                    meeting={editingMeeting}
                    subsidiary={subsidiary}
                    employees={employees}
                />
            )}
            
            {viewingMeeting && (
                <MeetingDetailsModal
                    isOpen={!!viewingMeeting}
                    onClose={handleCloseModals}
                    onSaveMinutes={handleSaveMinutes}
                    employees={employees}
                    meeting={viewingMeeting}
                />
            )}

            {deletingMeeting && (
                <ConfirmationModal
                    isOpen={!!deletingMeeting}
                    onClose={handleCloseModals}
                    onConfirm={handleDeleteMeeting}
                    title={t('secretariat.meetings.modal.deleteTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: deletingMeeting.title })}
                />
            )}
        </div>
    );
};

export default MeetingManagement;