import React, { useState, useEffect } from 'react';
import { Subsidiary, AbsenceRecord, AbsenceType, Employee } from '../../types';
import { useI18n } from '../../i18n';

interface AbsenceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<AbsenceRecord>) => void;
    absence: AbsenceRecord | null;
    employees: Employee[];
    subsidiary: Subsidiary;
}

type AbsenceFormData = Omit<Partial<AbsenceRecord>, 'employeeName' | 'subsidiaryId'>;

const AbsenceFormModal: React.FC<AbsenceFormModalProps> = ({ isOpen, onClose, onSave, absence, employees, subsidiary }) => {
    const { t } = useI18n();
    
    const initialFormState: AbsenceFormData = {
        employeeId: '',
        typeAbsence: AbsenceType.JUSTIFIED,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
        documentUrl: '',
    };
    
    const [formData, setFormData] = useState<AbsenceFormData>(initialFormState);

    useEffect(() => {
        if (absence) {
            // When editing, populate form with existing absence data, formatting dates for input type="date"
            setFormData({
                id: absence.id, // CRUCIAL: Ensure the ID is part of the form data for updates
                employeeId: absence.employeeId,
                typeAbsence: absence.typeAbsence, // Use the actual absence type from the record
                startDate: new Date(absence.startDate).toISOString().split('T')[0], // Format date for input type="date"
                endDate: new Date(absence.endDate).toISOString().split('T')[0],     // Format date for input type="date"
                reason: absence.reason,
                documentUrl: absence.documentUrl || '',
            });
        } else {
            setFormData(initialFormState);
        }
    }, [absence, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            // In a real app, this would upload the file and return a URL
            const fileName = e.target.files[0].name;
            setFormData(prev => ({ ...prev, documentUrl: `/docs/justifications/${fileName}` }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const employee = employees.find(e => e.id === formData.employeeId);
        onSave({
            ...formData,
            employeeName: employee ? `${employee.firstName} ${employee.lastName}` : '',
        
            subsidiaryId: subsidiary.id,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            {absence ? t('configuration.modal.editAbsenceTitle') : t('configuration.modal.addAbsenceTitle')}
                        </h3>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="employeeId" className="block text-sm font-medium text-slate-700">{t('hr.absences.table.employee')}</label>
                                <select name="employeeId" id="employeeId" value={formData.employeeId} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                    <option value="" disabled>{t('login.selectSubsidiary')}</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{`${emp.firstName} ${emp.lastName}`}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="typeAbsence" className="block text-sm font-medium text-slate-700">{t('configuration.form.absenceType')}</label>
                                <select name="typeAbsence" id="typeAbsence" value={formData.typeAbsence} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                    <option value={AbsenceType.JUSTIFIED}>{t('hr.absenceType.JUSTIFIED')}</option>
                                    <option value={AbsenceType.UNJUSTIFIED}>{t('hr.absenceType.UNJUSTIFIED')}</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">{t('configuration.form.startDate')}</label>
                                    <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">{t('configuration.form.endDate')}</label>
                                    <input type="date" name="endDate" id="endDate" value={formData.endDate} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="reason" className="block text-sm font-medium text-slate-700">{t('configuration.form.reason')}</label>
                                <textarea name="reason" id="reason" value={formData.reason} onChange={handleChange} required rows={3} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('configuration.form.document')}</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div className="flex text-sm text-slate-600">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#c6e911] hover:text-[#adc40f] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#c6e911]">
                                                <span>{t('configuration.form.uploadFile')}</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                            </label>
                                        </div>
                                        {formData.documentUrl && <p className="text-xs text-slate-500">{formData.documentUrl.split('/').pop()}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                        <button type="submit" disabled={!formData.employeeId} className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] disabled:bg-slate-400 transition-colors">{t('common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AbsenceFormModal;