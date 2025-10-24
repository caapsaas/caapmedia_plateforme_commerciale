import React, { useState, useEffect } from 'react';
import { Subsidiary, Employee, AttendanceRecord, AttendanceStatus } from '../../types';
import { useI18n } from '../../i18n';
import SignaturePad from '../common/SignaturePad';

interface AttendanceActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: Partial<AttendanceRecord>) => void;
    employees: Employee[];
    subsidiary: Subsidiary;
}

const AttendanceActionModal: React.FC<AttendanceActionModalProps> = ({ isOpen, onClose, onSave, employees, subsidiary }) => {
    const { t } = useI18n();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<AttendanceStatus>(AttendanceStatus.PRESENT);
    const [times, setTimes] = useState({
        arrivalTime: '',
        breakStartTime: '',
        breakEndTime: '',
        departureTime: ''
    });
    const [isSigning, setIsSigning] = useState(false);

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTimes(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveSignature = (signature: string) => {
        const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
        if (!selectedEmployee) return;

        const newRecord: Partial<AttendanceRecord> = {
            employeeId: selectedEmployeeId,
            employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
            date,
            status,
            arrivalTime: times.arrivalTime || null,
            breakStartTime: times.breakStartTime || null,
            breakEndTime: times.breakEndTime || null,
            departureTime: times.departureTime || null,
            signature,
            subsidiaryId: subsidiary.id,
        };
        onSave(newRecord);
        setIsSigning(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSigning(true);
    };
    
    if (!isOpen) return null;

    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                    <form onSubmit={handleSubmit}>
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-900">
                                {t('hr.attendance.record')}
                            </h3>
                            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="employeeId" className="block text-sm font-medium text-slate-700">{t('hr.attendance.employee')}</label>
                                        <select name="employeeId" id="employeeId" value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                            <option value="" disabled>Select an employee</option>
                                            {employees.map(emp => <option key={emp.id} value={emp.id}>{`${emp.firstName} ${emp.lastName}`}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="date" className="block text-sm font-medium text-slate-700">{t('hr.attendance.date')}</label>
                                        <input type="date" name="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-slate-700">{t('hr.attendance.status')}</label>
                                    <select name="status" id="status" value={status} onChange={e => setStatus(e.target.value as AttendanceStatus)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        <option value="PRESENT">{t('hr.attendance.status_PRESENT')}</option>
                                        <option value="ABSENT_JUSTIFIED">{t('hr.attendance.status_ABSENT_JUSTIFIED')}</option>
                                        <option value="ABSENT_UNJUSTIFIED">{t('hr.attendance.status_ABSENT_UNJUSTIFIED')}</option>
                                        <option value="HOLIDAY">{t('hr.attendance.status_HOLIDAY')}</option>
                                    </select>
                                </div>
                                {status === 'PRESENT' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="arrivalTime" className="block text-sm font-medium text-slate-700">{t('hr.attendance.arrivalTime')}</label>
                                            <input type="time" name="arrivalTime" id="arrivalTime" value={times.arrivalTime} onChange={handleTimeChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                         <div>
                                            <label htmlFor="departureTime" className="block text-sm font-medium text-slate-700">{t('hr.attendance.departureTime')}</label>
                                            <input type="time" name="departureTime" id="departureTime" value={times.departureTime} onChange={handleTimeChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                         <div>
                                            <label htmlFor="breakStartTime" className="block text-sm font-medium text-slate-700">Début Pause</label>
                                            <input type="time" name="breakStartTime" id="breakStartTime" value={times.breakStartTime} onChange={handleTimeChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                        <div>
                                            <label htmlFor="breakEndTime" className="block text-sm font-medium text-slate-700">Fin Pause</label>
                                            <input type="time" name="breakEndTime" id="breakEndTime" value={times.breakEndTime} onChange={handleTimeChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                            <button type="submit" disabled={!selectedEmployeeId} className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors disabled:bg-slate-400">{t('hr.modals.sign.save')}</button>
                        </div>
                    </form>
                </div>
            </div>

            {isSigning && selectedEmployee && (
                <SignaturePad
                    onSave={handleSaveSignature}
                    onClose={() => setIsSigning(false)}
                    title={t('configuration.modal.recordAttendanceTitle', { employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}` })}
                    clearLabel={t('hr.modals.sign.clear')}
                    saveLabel={t('common.save')}
                />
            )}
        </>
    );
};

export default AttendanceActionModal;