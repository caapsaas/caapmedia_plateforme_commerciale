import React, { useState } from 'react';
import { Subsidiary, Employee, Attendance, Payroll, Absence } from '../types';
import { useI18n } from '../i18n';
import EmployeeDatabase from './hr/EmployeeDatabase';
import AttendanceManagement from './hr/AttendanceManagement';
import PayrollManagement from './hr/PayrollManagement';
import AbsenceManagement from './hr/AbsenceManagement';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getEmployees, saveEmployee, deleteEmployee,
    getAttendances, saveAttendance,
    getAbsences, saveAbsence, deleteAbsence,
    getPayrolls, processPayroll
} from '../services/apihr/apiPayroll';

type HrView = 'employees' | 'attendance' | 'payroll' | 'absences';

interface HrManagementProps {
    subsidiary: Subsidiary;
}

const HrManagement: React.FC<HrManagementProps> = ({ subsidiary }) => {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<HrView>('employees');

    // --- Data Fetching ---
    const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({ queryKey: ['employees', subsidiary.id], queryFn: () => getEmployees(subsidiary.id) });
    const { data: attendances = [], isLoading: isLoadingAttendances } = useQuery<Attendance[]>({ queryKey: ['attendances', subsidiary.id], queryFn: () => getAttendances(subsidiary.id) });
    const { data: absences = [], isLoading: isLoadingAbsences } = useQuery<Absence[]>({ queryKey: ['absences', subsidiary.id], queryFn: () => getAbsences(subsidiary.id) });
    const { data: payrolls = [], isLoading: isLoadingPayrolls } = useQuery<Payroll[]>({ queryKey: ['payrolls', subsidiary.id], queryFn: () => getPayrolls(subsidiary.id) });

    // --- Mutations ---
    const { mutate: onSaveEmployee } = useMutation({ mutationFn: saveEmployee, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }) });
    const { mutate: onDeleteEmployee } = useMutation({ mutationFn: deleteEmployee, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }) });
    const { mutate: onSaveAttendance } = useMutation({ mutationFn: saveAttendance, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendances'] }) });
    const { mutate: onSaveAbsence } = useMutation({ mutationFn: saveAbsence, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['absences'] }) });
    const { mutate: onDeleteAbsence } = useMutation({ mutationFn: deleteAbsence, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['absences'] }) });
    const { mutate: onProcessPayroll } = useMutation({ mutationFn: processPayroll, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrolls'] }) });

    const isLoading = isLoadingEmployees || isLoadingAttendances || isLoadingAbsences || isLoadingPayrolls;

    const renderActiveView = () => {
        if (isLoading) {
            return <div className="p-6 text-center">{t('common.loading')}</div>;
        }

        switch (activeTab) {
            case 'employees':
                return <EmployeeDatabase 
                            subsidiary={subsidiary} 
                            employees={employees}
                            onSave={onSaveEmployee}
                            onDelete={onDeleteEmployee}
                        />;
            case 'attendance':
                return <AttendanceManagement subsidiary={subsidiary} employees={employees} attendances={attendances} onSave={onSaveAttendance} />;
            case 'payroll':
                return <PayrollManagement subsidiary={subsidiary} employees={employees} payrolls={payrolls} onProcessPayroll={onProcessPayroll} />;
            case 'absences':
                return <AbsenceManagement 
                            subsidiary={subsidiary} 
                            employees={employees} 
                            absences={absences}
                            onSave={onSaveAbsence}
                            onDelete={onDeleteAbsence}
                        />;
            default:
                return <EmployeeDatabase subsidiary={subsidiary} employees={employees} onSave={onSaveEmployee} onDelete={onDeleteEmployee} />;
        }
    };

    const TabButton: React.FC<{ view: HrView; label: string }> = ({ view, label }) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c6e911] ${
                activeTab === view
                    ? 'bg-[#c6e911] text-slate-800 shadow'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">{t('hr.title')}</h2>
                <div className="flex items-center flex-wrap gap-2 p-1 bg-slate-200 rounded-lg self-start sm:self-center">
                    <TabButton view="employees" label={t('hr.tabs.employees')} />
                    <TabButton view="attendance" label={t('hr.tabs.attendance')} />
                    <TabButton view="absences" label={t('hr.tabs.absences')} />
                    <TabButton view="payroll" label={t('hr.tabs.payroll')} />
                </div>
            </div>
            
            <div>
                {renderActiveView()}
            </div>
        </div>
    );
};

export default HrManagement;