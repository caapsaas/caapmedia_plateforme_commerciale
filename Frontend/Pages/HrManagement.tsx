import React, { useState } from 'react';
import { Outlet, useLocation } from '@tanstack/react-router';
import { Employee, PayrollRecord, AbsenceRecord } from '../types';
import { useAppContext } from '../context/AppContext';
import { useI18n } from '../i18n';
import AttendanceCards from '../components/hr/AttendanceCards';
import AttendanceHistory from '../components/hr/AttendanceHistory';
import PayrollManagement from '../components/hr/PayrollManagement';
import AbsenceManagement from '../components/hr/AbsenceManagement';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAbsenceRecords, saveAbsenceRecord, deleteAbsenceRecord } from '../services/apihr/apiAbsences';
import { getPayrollRecords, processPayroll, signPayrollRecord } from '../services/apihr/apiPayroll';
import { getEmployees, saveEmployee, deleteEmployee, saveEmployeeWithDocumentsAndLeaves, getEmployeeWithRelations } from '../services/apihr/apiEmployees';
import { useAuth } from '../context/AuthContext';
import EmployeeDatabaseModern from '../components/hr/EmployeeDatabaseModern';
import CrmListSkeleton from '../components/ui/CrmListSkeleton';

type HrView = 'employees' | 'attendance-cards' | 'attendance-history' | 'payroll' | 'absences';

const HrManagement: React.FC = () => {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const { subsidiary } = useAuth();
    const [activeTab, setActiveTab] = useState<HrView>('employees');
    const location = useLocation();
    
    // Vérifier si on est sur une route enfant (cards, history, signing)
    const isChildRoute = location.pathname.includes('/dashboard/hr/') && 
                         location.pathname !== '/dashboard/hr';

    if (!subsidiary) {
        return <CrmListSkeleton columns={7} />;
    }

    // --- Data Fetching ---
    // La liste complète des employés n'est plus nécessaire pour l'onglet
    // "employees" — EmployeeDatabaseModern se charge lui-même (paginé). Elle
    // reste requise ici pour le croisement dans Payroll/Absences.
    const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({
        queryKey: ['employees', subsidiary.id],
        queryFn: () => getEmployees(true)
    });
    const { data: absences = [], isLoading: isLoadingAbsences } = useQuery<AbsenceRecord[]>({ queryKey: ['absences', subsidiary.id], queryFn: () => getAbsenceRecords() });
    const { data: payrolls = [], isLoading: isLoadingPayrolls } = useQuery<PayrollRecord[]>({ queryKey: ['payrolls', subsidiary.id], queryFn: () => getPayrollRecords() });

    // --- Mutations ---
    const saveEmployeeWithCompleteData = async (employeeData: any) => {
        const savedEmployee = await saveEmployeeWithDocumentsAndLeaves(employeeData);
        const completeEmployee = await getEmployeeWithRelations(savedEmployee.id);
        return completeEmployee;
    };

    const { mutate: onSaveEmployee } = useMutation({
        mutationFn: saveEmployeeWithCompleteData,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees', subsidiary.id] }),
    });
    const { mutate: onDeleteEmployee } = useMutation({ mutationFn: deleteEmployee, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees', subsidiary.id] }) });
    const { mutate: onSaveAbsence } = useMutation({ mutationFn: saveAbsenceRecord, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['absences', subsidiary.id] }) });
    const { mutate: onDeleteAbsence } = useMutation({ mutationFn: deleteAbsenceRecord, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['absences', subsidiary.id] }) });
    const { mutate: onProcessPayroll } = useMutation({ mutationFn: processPayroll, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrolls', subsidiary.id] }) });
    const { mutate: onSaveSignature } = useMutation({ 
        mutationFn: ({ payrollId, signature }: { payrollId: string; signature: string }) => 
            signPayrollRecord(payrollId, signature),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrolls', subsidiary.id] }) 
    });

    // "employees" gère désormais son propre chargement (pagination serveur) ;
    // seuls payroll/absences dépendent encore du fetch parent `employees`.
    const isLoading = isLoadingEmployees || isLoadingAbsences || isLoadingPayrolls;

    const renderActiveView = () => {
        if (isLoading && !['attendance-cards', 'attendance-history', 'employees'].includes(activeTab)) {
            return <CrmListSkeleton columns={7} />;
        }

        switch (activeTab) {
            case 'employees':
                return <EmployeeDatabaseModern
                            subsidiary={subsidiary}
                            onSave={onSaveEmployee}
                            onDelete={onDeleteEmployee}
                        />;
            case 'attendance-cards':
                return <AttendanceCards subsidiary={subsidiary} />;
            case 'attendance-history':
                return <AttendanceHistory />;
            case 'payroll':
                return <PayrollManagement
                            subsidiary={subsidiary}
                            employees={employees}
                            payrolls={payrolls}
                            onProcessPayroll={onProcessPayroll}
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
            {/* N'afficher les onglets et le contenu que si on n'est pas sur une route enfant */}
            {!isChildRoute && (
                <>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <h2 className="text-3xl font-bold text-slate-800">{t('hr.title')}</h2>
                        <div className="flex items-center flex-wrap gap-2 p-1 bg-slate-200 rounded-lg self-start sm:self-center">
                            <TabButton view="employees" label={t('hr.tabs.employees')} />
                            <TabButton view="attendance-cards" label={t('hr.tabs.attendance_cards')} />
                            <TabButton view="attendance-history" label={t('hr.tabs.attendance_history')} />
                            <TabButton view="absences" label={t('hr.tabs.absences')} />
                            <TabButton view="payroll" label={t('hr.tabs.payroll')} />
                        </div>
                    </div>

                    <div>
                        {renderActiveView()}
                    </div>
                </>
            )}

            {/* Outlet pour les routes enfants (ex: /dashboard/hr/signing) */}
            <Outlet />
        </div>
    );
};

export default HrManagement;
