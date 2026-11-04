import { completeMeeting, uploadMeetingReport } from '../../services/apisecretariat/apiSecretariat';
import { downloadPrivateDocument } from '../../services/privateDocuments';
import React, { useEffect, useId, useState } from 'react';
import { Meeting, Employee } from '../../types';
import { useI18n } from '../../i18n';

interface MeetingDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveMinutes: (meetingId: string, minutes: string) => void;
    onMeetingUpdated: (meeting: Meeting) => void;
    meeting: Meeting;
    employees: Employee[];
}

const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({ isOpen, onClose, onSaveMinutes, onMeetingUpdated, meeting, employees }) => {
    const { t } = useI18n();
    const [minutes, setMinutes] = useState(meeting.minutes || '');
    const [reportFile, setReportFile] = useState<File | null>(null);
    const [reportBusy, setReportBusy] = useState(false);
    const [reportError, setReportError] = useState('');
    const reportInputId = useId();
    const started = new Date(meeting.meetingDateTime).getTime() <= Date.now();

    useEffect(() => {
        setMinutes(meeting.minutes || '');
        setReportFile(null);
        setReportError('');
        setIsEditing(false);
    }, [meeting.id]);

    const handleComplete = async () => {
        setReportBusy(true);
        setReportError('');
        try { onMeetingUpdated(await completeMeeting(meeting.id)); }
        catch { setReportError(t('secretariat.meetings.report.completeError')); }
        finally { setReportBusy(false); }
    };

    const handleUploadReport = async () => {
        if (!reportFile) return;
        setReportBusy(true);
        setReportError('');
        try {
            onMeetingUpdated(await uploadMeetingReport(meeting.id, reportFile));
            setReportFile(null);
            const input = document.getElementById(reportInputId) as HTMLInputElement | null;
            if (input) input.value = '';
        } catch { setReportError(t('secretariat.meetings.report.uploadError')); }
        finally { setReportBusy(false); }
    };

    const handleDownloadReport = async () => {
        if (!meeting.minutesFileUrl) return;
        setReportBusy(true);
        setReportError('');
        try { await downloadPrivateDocument(meeting.minutesFileUrl, meeting.minutesFileName || undefined); }
        catch { setReportError(t('secretariat.meetings.report.downloadError')); }
        finally { setReportBusy(false); }
    };
    const [isEditing, setIsEditing] = useState(false);

    const formatDate = (dateStr: string | Date) => new Date(dateStr).toLocaleDateString();
    const formatTime = (timeStr: string | Date) => new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const getParticipantNames = (participants: any[] | undefined) => {
        if (!participants || participants.length === 0) return '';
        return participants
            .map(p => {
                const employeeId = typeof p === 'string' ? p : p.employeeId;
                const employee = employees.find(e => e.id === employeeId);
                return employee ? `${employee.firstName} ${employee.lastName}` : 'Employé inconnu';
            })
            .join(', ');
    };


    const handleSave = () => {
        onSaveMinutes(meeting.id, minutes);
        setIsEditing(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 modal-backdrop z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-lg font-bold text-slate-900">{t('secretariat.meetings.modal.detailsTitle')}</h3>
                    <p className="text-slate-600">{meeting.title}</p>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <h4 className="font-semibold text-slate-700">{t('secretariat.meetings.table.date')}</h4>
                        <p className="text-slate-600">{`${formatDate(meeting.meetingDateTime)} at ${formatTime(meeting.meetingDateTime)}`}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-700">{t('secretariat.meetings.table.location')}</h4>
                        <p className="text-slate-600">{meeting.meetingLocation || '-'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-700">{t('secretariat.meetings.table.participants')}</h4>
                        <p className="text-slate-600">{getParticipantNames(meeting.participants)}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-700">{t('secretariat.meetings.details.agenda')}</h4>
                        <pre className="text-slate-600 bg-slate-50 p-2 rounded-md whitespace-pre-wrap font-sans">{meeting.agenda}</pre>
                    </div>
                    <div>
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-slate-700">{t('secretariat.meetings.details.minutes')}</h4>
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-[#c6e911] hover:text-[#adc40f]">
                                    {t('common.edit')}
                                </button>
                            )}
                        </div>
                        {isEditing ? (
                            <textarea 
                                value={minutes} 
                                onChange={(e) => setMinutes(e.target.value)} 
                                rows={6}
                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                            />
                        ) : (
                            <pre className="text-slate-600 bg-slate-50 p-2 rounded-md whitespace-pre-wrap font-sans min-h-[100px]">
                                {minutes || t('secretariat.meetings.details.noMinutes')}
                            </pre>
                        )}
                    </div>
                    <section className="border-t pt-4 space-y-3" aria-labelledby={`${reportInputId}-title`}>
                        <h4 id={`${reportInputId}-title`} className="font-semibold text-slate-700">{t('secretariat.meetings.report.title')}</h4>
                        {meeting.completedAt ? (
                            <p className="text-sm font-medium text-green-700">{t('secretariat.meetings.report.completed')}</p>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-slate-600">{t(started ? 'secretariat.meetings.report.afterCompletion' : 'secretariat.meetings.report.notStarted')}</p>
                                <button type="button" disabled={!started || reportBusy} onClick={handleComplete}
                                    className="px-3 py-2 bg-slate-200 rounded-md text-sm disabled:opacity-50">
                                    {t('secretariat.meetings.report.complete')}
                                </button>
                            </div>
                        )}
                        {meeting.minutesFileUrl ? (
                            <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-3">
                                <span className="min-w-0 break-all text-sm">{meeting.minutesFileName}</span>
                                <button type="button" disabled={reportBusy} onClick={handleDownloadReport}
                                    className="shrink-0 text-sm text-blue-700 underline disabled:opacity-50">
                                    {t('secretariat.meetings.report.download')}
                                </button>
                            </div>
                        ) : <p className="text-sm text-slate-500">{t('secretariat.meetings.report.none')}</p>}
                        {meeting.completedAt && (
                            <div className="space-y-2">
                                <label htmlFor={reportInputId} className="block text-sm font-medium">{t('secretariat.meetings.report.choose')}</label>
                                <input id={reportInputId} type="file" disabled={reportBusy}
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    className="block w-full text-sm" aria-describedby={`${reportInputId}-formats`}
                                    onChange={event => {
                                        const selected = event.target.files?.[0] || null;
                                        setReportError('');
                                        if (selected && (selected.size === 0 || selected.size > 10 * 1024 * 1024 || !/\.(pdf|doc|docx)$/i.test(selected.name))) {
                                            setReportFile(null);
                                            event.target.value = '';
                                            setReportError(t('secretariat.meetings.report.invalidFile'));
                                        } else setReportFile(selected);
                                    }} />
                                <p id={`${reportInputId}-formats`} className="text-xs text-slate-500">{t('secretariat.meetings.report.formats')}</p>
                                <button type="button" disabled={!reportFile || reportBusy} onClick={handleUploadReport}
                                    className="px-3 py-2 bg-[#c6e911] text-slate-800 rounded-md text-sm disabled:opacity-50">
                                    {reportBusy ? t('common.loading') : t(meeting.minutesFileUrl ? 'secretariat.meetings.report.replace' : 'secretariat.meetings.report.upload')}
                                </button>
                            </div>
                        )}
                        {reportError && <p role="alert" className="text-sm text-red-700">{reportError}</p>}
                    </section>
                </div>
                <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                    {isEditing && (
                        <>
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors">{t('common.save')}</button>
                        </>
                    )}
                    {!isEditing && (
                        <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.close')}</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MeetingDetailsModal;
