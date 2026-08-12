import React, { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
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

    // `t` renvoie la clé elle-même quand la traduction est absente : ce repli
    // évite d'afficher une clé brute à l'écran, et laisse la traduction
    // reprendre la main dès qu'elle est ajoutée aux fichiers de locale.
    const label = (key: string, fallback: string) => {
        const value = t(key);
        return value === key ? fallback : value;
    };

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
    const [participantSearch, setParticipantSearch] = useState('');

    useEffect(() => {
        setParticipantSearch('');
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
    
    const employeeFullName = (emp: Employee) => `${emp.firstName} ${emp.lastName}`;

    const filteredEmployees = useMemo(() => {
        const query = participantSearch.trim().toLowerCase();
        if (!query) return employees;
        return employees.filter(emp => employeeFullName(emp).toLowerCase().includes(query));
    }, [employees, participantSearch]);

    const selectedEmployees = useMemo(
        () => employees.filter(emp => formData.participants.includes(emp.id)),
        [employees, formData.participants],
    );

    // Un clic sur la ligne suffit : plus besoin de Ctrl/Cmd comme avec un
    // <select multiple>, et une sélection existante ne peut plus être perdue
    // par un clic accidentel.
    const toggleParticipant = (employeeId: string) => {
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.includes(employeeId)
                ? prev.participants.filter(id => id !== employeeId)
                : [...prev.participants, employeeId],
        }));
    };

    // Porte sur la liste filtrée : "tout sélectionner" après une recherche
    // ajoute les résultats affichés sans écraser le reste de la sélection.
    const selectAllFiltered = () => {
        setFormData(prev => ({
            ...prev,
            participants: Array.from(new Set([...prev.participants, ...filteredEmployees.map(emp => emp.id)])),
        }));
    };

    const clearParticipants = () => {
        setFormData(prev => ({ ...prev, participants: [] }));
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
                            {meeting
                                ? label('secretariat.editMeeting', 'Modifier la réunion')
                                : label('secretariat.addMeeting', 'Ajouter une réunion')}
                        </h3>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-slate-700">{label('secretariat.title', 'Titre')}</label>
                                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium text-slate-700">{t('common.date')}</label>
                                    <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="time" className="block text-sm font-medium text-slate-700">{label('secretariat.meetingTime', 'Heure')}</label>
                                    <input type="time" name="time" id="time" value={formData.time} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="location" className="block text-sm font-medium text-slate-700">{label('secretariat.meetingLocation', 'Lieu')}</label>
                                <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                             <div>
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="block text-sm font-medium text-slate-700">
                                        {label('secretariat.participants', 'Participants')}
                                        {formData.participants.length > 0 && (
                                            <span className="ml-2 text-xs font-normal text-slate-500">
                                                {formData.participants.length} {label('secretariat.form.selectedCount', 'sélectionné(s)')}
                                            </span>
                                        )}
                                    </span>
                                    <div className="flex items-center gap-2 text-xs">
                                        <button
                                            type="button"
                                            onClick={selectAllFiltered}
                                            disabled={filteredEmployees.length === 0}
                                            className="font-medium text-slate-600 hover:text-slate-900 hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                                        >
                                            {label('secretariat.form.selectAll', 'Tout sélectionner')}
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button
                                            type="button"
                                            onClick={clearParticipants}
                                            disabled={formData.participants.length === 0}
                                            className="font-medium text-slate-600 hover:text-slate-900 hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                                        >
                                            {label('secretariat.form.clearSelection', 'Tout effacer')}
                                        </button>
                                    </div>
                                </div>

                                {selectedEmployees.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {selectedEmployees.map(emp => (
                                            <span key={emp.id} className="inline-flex items-center gap-1 rounded-full bg-[#f2fac9] py-1 pl-2.5 pr-1 text-xs font-medium text-slate-700">
                                                {employeeFullName(emp)}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleParticipant(emp.id)}
                                                    aria-label={`${label('secretariat.form.removeParticipant', 'Retirer le participant')} : ${employeeFullName(emp)}`}
                                                    className="rounded-full p-0.5 text-slate-500 hover:bg-white hover:text-slate-800"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="relative mt-2">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={participantSearch}
                                        onChange={e => setParticipantSearch(e.target.value)}
                                        placeholder={label('secretariat.form.searchParticipant', 'Rechercher un employé…')}
                                        className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 shadow-sm focus:border-[#c6e911] focus:outline-none focus:ring-1 focus:ring-[#c6e911] sm:text-sm"
                                    />
                                </div>

                                <div
                                    role="group"
                                    aria-label={label('secretariat.participants', 'Participants')}
                                    className="mt-2 max-h-48 overflow-y-auto rounded-md border border-slate-300 divide-y divide-slate-100"
                                >
                                    {filteredEmployees.length === 0 ? (
                                        <p className="px-3 py-6 text-center text-sm text-slate-400">
                                            {label('secretariat.form.noEmployeeFound', 'Aucun employé trouvé')}
                                        </p>
                                    ) : (
                                        filteredEmployees.map(emp => {
                                            const isSelected = formData.participants.includes(emp.id);
                                            return (
                                                <label
                                                    key={emp.id}
                                                    className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-slate-50 ${isSelected ? 'bg-[#f8fde8]' : ''}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleParticipant(emp.id)}
                                                        className="h-4 w-4 shrink-0 rounded border-slate-300 text-[#c6e911] focus:ring-1 focus:ring-[#c6e911]"
                                                    />
                                                    <span className="min-w-0 flex-1 truncate text-slate-700">{employeeFullName(emp)}</span>
                                                    {emp.positions && (
                                                        <span className="shrink-0 text-xs text-slate-400">{emp.positions}</span>
                                                    )}
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="agenda" className="block text-sm font-medium text-slate-700">{label('secretariat.agenda', 'Ordre du jour')}</label>
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