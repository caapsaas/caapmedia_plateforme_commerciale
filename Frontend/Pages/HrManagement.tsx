import React, { useState } from 'react';
import { Employee, AttendanceRecord, PayrollRecord, AbsenceRecord } from '../types';
import { useAppContext } from '../context/AppContext';
import { useI18n } from '../i18n';
import EmployeeDatabase from '../components/hr/EmployeeDatabase';
import AttendanceManagement from '../components/hr/AttendanceManagement';
import PayrollManagement from '../components/hr/PayrollManagement';
import AbsenceManagement from '../components/hr/AbsenceManagement';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAttendanceRecords, saveAttendanceRecord } from '../services/apihr/apiAttendance';
import { getAbsenceRecords, saveAbsenceRecord, deleteAbsenceRecord } from '../services/apihr/apiAbsences';
import { getPayrollRecords, processPayroll, signPayrollRecord } from '../services/apihr/apiPayroll';
import { getEmployees, saveEmployee, deleteEmployee } from '../services/apihr/apiEmployees';
import { useAuth } from '../context/AuthContext';

type HrView = 'employees' | 'attendance' | 'payroll' | 'absences';

const HrManagement: React.FC = () => {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const { subsidiary } = useAuth();
    const [activeTab, setActiveTab] = useState<HrView>('employees');

    if (!subsidiary) {
        return <div className="p-6 text-center">{t('common.loading')}</div>;
    }

    // --- Data Fetching ---
    const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({ queryKey: ['employees', subsidiary.id], queryFn: () => getEmployees() });
    const { data: attendances = [], isLoading: isLoadingAttendances } = useQuery<AttendanceRecord[]>({ queryKey: ['attendances', subsidiary.id], queryFn: () => getAttendanceRecords() });
    const { data: absences = [], isLoading: isLoadingAbsences } = useQuery<AbsenceRecord[]>({ queryKey: ['absences', subsidiary.id], queryFn: () => getAbsenceRecords() });
    const { data: payrolls = [], isLoading: isLoadingPayrolls } = useQuery<PayrollRecord[]>({ queryKey: ['payrolls', subsidiary.id], queryFn: () => getPayrollRecords() });

    // --- Mutations ---
    const { mutate: onSaveEmployee } = useMutation({ mutationFn: saveEmployee, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees', subsidiary.id] }) });
    const { mutate: onDeleteEmployee } = useMutation({ mutationFn: deleteEmployee, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees', subsidiary.id] }) });
    const { mutate: onSaveAttendance } = useMutation({ mutationFn: saveAttendanceRecord, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendances', subsidiary.id] }) });
    const { mutate: onSaveAbsence } = useMutation({ mutationFn: saveAbsenceRecord, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['absences', subsidiary.id] }) });
    const { mutate: onDeleteAbsence } = useMutation({ mutationFn: deleteAbsenceRecord, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['absences', subsidiary.id] }) });
    const { mutate: onProcessPayroll } = useMutation({ mutationFn: processPayroll, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrolls', subsidiary.id] }) });
    const { mutate: onSaveSignature } = useMutation({ mutationFn: signPayrollRecord, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrolls', subsidiary.id] }) });

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
                return <PayrollManagement 
                            subsidiary={subsidiary} 
                            employees={employees} 
                            payrolls={payrolls} 
                            onProcessPayroll={onProcessPayroll}
                            onRecordPayment={() => {}} // TODO: Implémenter l'enregistrement de paiement
                            onSaveSignature={onSaveSignature}
                        />;
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