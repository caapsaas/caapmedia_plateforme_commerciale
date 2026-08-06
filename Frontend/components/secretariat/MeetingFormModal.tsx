import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // 👈 pour récupérer la filiale (subsidiary)
import { Meeting, Subsidiary, Employee } from '../../types';
import { useI18n } from '../../i18n';
import { SaveMeetingDto } from '../../services/apisecretariat/apiSecretariat';

interface MeetingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: SaveMeetingDto) => void;
    meeting: Meeting | null;
    subsidiary: Subsidiary;
    employees: Employee[];
}

const MeetingFormModal: React.FC<MeetingFormModalProps> = ({ isOpen, onClose, onSave, meeting, employees }) => {
    const { t } = useI18n();
    const initialFormState = {
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00', // Default to 9 AM
        location: '',
        participants: [] as string[],
        agenda: '',
        minutes: '',
    };
    
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (meeting) {
            const dateTime = new Date(meeting.meetingDateTime || new Date());
            const date = dateTime.toISOString().split('T')[0];
            const time = dateTime.toTimeString().slice(0, 5);
            const participantIds = meeting.participants?.map(p => p.employeeId) || [];

            setFormData({
                title: meeting.title,
                date,
                time,
                location: meeting.meetingLocation || '',
                participants: participantIds,
                agenda: meeting.agenda || '',
                minutes: meeting.minutes || '',
            });
        } else {
            setFormData(initialFormState);
        }
    }, [meeting, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleParticipantsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({ ...prev, participants: selectedOptions }));
    };
    const { subsidiary } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Fusionne la date et l’heure pour former un objet Date valide
    const meetingDateTime = new Date(`${formData.date}T${formData.time}:00`);

    // Correspond au CreateMeetingDto
    const payload = {
      title: formData.title,
      meetingDateTime, // objet Date combinant date + heure
      meetingLocation: formData.location,
      agenda: formData.agenda || "",
      participantIds: formData.participants, // tableau d’UUID
    };

    onSave(payload);
  };



    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            {meeting ? t('secretariat.meetings.modal.editTitle') : t('secretariat.meetings.modal.addTitle')}
                        </h3>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-slate-700">{t('secretariat.meetings.table.title')}</label>
                                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium text-slate-700">{t('common.date')}</label>
                                    <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="time" className="block text-sm font-medium text-slate-700">Heure</label>
                                    <input type="time" name="time" id="time" value={formData.time} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="location" className="block text-sm font-medium text-slate-700">{t('secretariat.meetings.table.location')}</label>
                                <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                             <div>
                                <label htmlFor="participants" className="block text-sm font-medium text-slate-700">{t('secretariat.meetings.table.participants')}</label>
                                <select 
                                    multiple 
                                    name="participants" 
                                    id="participants" 
                                    value={formData.participants} 
                                    onChange={handleParticipantsChange} 
                                    className="mt-1 block w-full h-32 border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                                >
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{`${emp.firstName} ${emp.lastName}`}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="agenda" className="block text-sm font-medium text-slate-700">{t('secretariat.meetings.details.agenda')}</label>
                                <textarea name="agenda" id="agenda" value={formData.agenda} onChange={handleChange} rows={4} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"></textarea>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors">{t('common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MeetingFormModal;