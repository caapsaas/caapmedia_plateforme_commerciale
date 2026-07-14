import React, { useState } from 'react';
import { Meeting } from '../../types';
import { useI18n } from '../../i18n';

interface MeetingDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveMinutes: (meetingId: string, minutes: string) => void;
    meeting: Meeting;
}

const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({ isOpen, onClose, onSaveMinutes, meeting }) => {
    const { t } = useI18n();
    const [minutes, setMinutes] = useState(meeting.minutes);
    const [isEditing, setIsEditing] = useState(false);

    const formatDate = (dateStr: string | Date) => new Date(dateStr).toLocaleDateString();
    const formatTime = (timeStr: string | Date) => new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Convertit les participantIds en noms complets
   const getParticipantNames = (participants: { employee: Employee }[]) => {
    if (!participants || participants.length === 0) return '';
    return participants
        .map(p => p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : 'Employé inconnu')
        .join(', ');
};


    const handleSave = () => {
        onSaveMinutes(meeting.id, minutes);
        setIsEditing(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-lg font-bold text-slate-900">{t('secretariat.meetings.modal.detailsTitle')}</h3>
                    <p className="text-slate-600">{meeting.title}</p>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <h4 className="font-semibold text-slate-700">{t('secretariat.meetings.table.date')}</h4>
                        <p className="text-slate-600">{`${formatDate(meeting.date)} at ${formatTime(meeting.time)}`}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-700">{t('secretariat.meetings.table.location')}</h4>
                        <p className="text-slate-600">{meeting.location}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-700">{t('secretariat.meetings.table.participants')}</h4>
                    <p className="text-slate-600">{getParticipantNames(meeting.participants || [])}</p>

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
                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                            />
                        ) : (
                            <pre className="text-slate-600 bg-slate-50 p-2 rounded-md whitespace-pre-wrap font-sans min-h-[100px]">
                                {minutes || t('secretariat.meetings.details.noMinutes')}
                            </pre>
                        )}
                    </div>
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
