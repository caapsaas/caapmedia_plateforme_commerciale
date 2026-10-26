import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from '@tanstack/react-router';
import { Employee, PayrollRecord, AbsenceRecord, UserRole, Subsidiary } from '../types';
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
import PreHireTrainingManagement from '../components/hr/PreHireTrainingManagement';
import CrmListSkeleton from '../components/ui/CrmListSkeleton';
import { getSubsidiaries } from '../services/apiCommon/apiSubsidiaries';

type HrView = 'employees' | 'pre-hire-training' | 'attendance-cards' | 'attendance-history' | 'payroll' | 'absences';

const HrManagement: React.FC = () => {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const { subsidiary, user } = useAuth();
    const isPreHireOnly = (user?.activeRole ?? user?.userRole) === UserRole.PRE_HIRE_MANAGER;
    const [activeTab, setActiveTab] = useState<HrView>('employees');
    const [selectedSubsidiaryId, setSelectedSubsidiaryId] = useState('');
    const location = useLocation();
    const isSuperAdmin = user?.userRole === UserRole.SUPER_ADMIN || user?.additionalRoles?.includes(UserRole.SUPER_ADMIN) === true;
    const { data: subsidiaries = [], isLoading: isLoadingSubsidiaries } = useQuery<Subsidiary[]>({
        queryKey: ['subsidiaries'],
        queryFn: getSubsidiaries,
        enabled: isSuperAdmin,
    });

    useEffect(() => {
        if (!isSuperAdmin && subsidiary?.id) setSelectedSubsidiaryId(subsidiary.id);
        if (isSuperAdmin && !selectedSubsidiaryId && subsidiaries.length > 0) {
            setSelectedSubsidiaryId(subsidiary?.id || subsidiaries[0].id);
        }
    }, [isSuperAdmin, subsidiary?.id, selectedSubsidiaryId, subsidiaries]);
    
    // Vérifier si on est sur une route enfant (cards, history, signing)
    const isChildRoute = location.pathname.includes('/dashboard/hr/') && 
                         location.pathname !== '/dashboard/hr';

    const effectiveSubsidiaryId = isSuperAdmin ? selectedSubsidiaryId : subsidiary?.id;
    const activeSubsidiary = (isSuperAdmin ? subsidiaries.find((item) => item.id === effectiveSubsidiaryId) : subsidiary) ?? subsidiary;

    // --- Data Fetching ---
    // La liste complète des employés n'est plus nécessaire pour l'onglet
    // "employees" — EmployeeDatabaseModern se charge lui-même (paginé). Elle
    // reste requise ici pour le croisement dans Payroll/Absences.
    const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({
        queryKey: ['employees', effectiveSubsidiaryId],
        queryFn: () => getEmployees(true, effectiveSubsidiaryId),
        enabled: !!effectiveSubsidiaryId && !isPreHireOnly,
    });
    const { data: absences = [], isLoading: isLoadingAbsences } = useQuery<AbsenceRecord[]>({ queryKey: ['absences', effectiveSubsidiaryId], queryFn: () => getAbsenceRecords(effectiveSubsidiaryId), enabled: !!effectiveSubsidiaryId && !isPreHireOnly });
    const { data: payrolls = [], isLoading: isLoadingPayrolls } = useQuery<PayrollRecord[]>({ queryKey: ['payrolls', effectiveSubsidiaryId], queryFn: () => getPayrollRecords(effectiveSubsidiaryId), enabled: !!effectiveSubsidiaryId && !isPreHireOnly });

    // --- Mutations ---
    const saveEmployeeWithCompleteData = async (employeeData: any) => {
        const savedEmployee = await saveEmployeeWithDocumentsAndLeaves(employeeData);
        const completeEmployee = await getEmployeeWithRelations(savedEmployee.id);
        return completeEmployee;
    };

    const { mutate: onSaveEmployee } = useMutation({
        mutationFn: saveEmployeeWithCompleteData,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees', effectiveSubsidiaryId] }),
    });
    const { mutate: onDeleteEmployee } = useMutation({ mutationFn: deleteEmployee, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees', effectiveSubsidiaryId] }) });
    const { mutate: onSaveAbsence } = useMutation({ mutationFn: saveAbsenceRecord, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['absences', effectiveSubsidiaryId] }) });
    const { mutate: onDeleteAbsence } = useMutation({ mutationFn: deleteAbsenceRecord, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['absences', effectiveSubsidiaryId] }) });
    const { mutate: onProcessPayroll } = useMutation({ mutationFn: processPayroll, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrolls', effectiveSubsidiaryId] }) });
    const { mutate: onSaveSignature } = useMutation({ 
        mutationFn: ({ payrollId, signature }: { payrollId: string; signature: string }) => 
            signPayrollRecord(payrollId, signature),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrolls', effectiveSubsidiaryId] })
    });

    if (!activeSubsidiary || !effectiveSubsidiaryId) {
        return <CrmListSkeleton columns={7} />;
    }

    // Chaque onglet gère désormais son propre skeleton (forme adaptée à sa
    // vraie disposition) plutôt qu'un gate générique au niveau de la page.
    const renderActiveView = () => {
        switch (activeTab) {
            case 'employees':
                return <EmployeeDatabaseModern
                            subsidiary={activeSubsidiary!}
                            subsidiaryFilterId={effectiveSubsidiaryId}
                            onSave={onSaveEmployee}
                            onDelete={onDeleteEmployee}
                        />;
            case 'pre-hire-training':
                return <PreHireTrainingManagement subsidiaryId={effectiveSubsidiaryId!} onConverted={() => setActiveTab('employees')} />;
            case 'attendance-cards':
                return <AttendanceCards subsidiary={activeSubsidiary!} />;
            case 'attendance-history':
                return <AttendanceHistory />;
            case 'payroll':
                return <PayrollManagement
                            subsidiary={activeSubsidiary!}
                            employees={employees}
                            payrolls={payrolls}
                            isLoading={isLoadingPayrolls}
                            onProcessPayroll={onProcessPayroll}
                            onSaveSignature={onSaveSignature}
                        />;
            case 'absences':
                return <AbsenceManagement
                            subsidiary={activeSubsidiary!}
                            employees={employees}
                            absences={absences}
                            isLoading={isLoadingAbsences}
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
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800">{t('hr.title')}</h2>
                            <p className="mt-1 text-sm text-slate-500">{t('hr.activeSubsidiary')} : <span className="font-semibold text-slate-700">{activeSubsidiary?.subsidiaryName || activeSubsidiary?.name}</span></p>
                        </div>
                        {isSuperAdmin && (
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                {t('hr.activeSubsidiary')}
                                <select value={selectedSubsidiaryId} onChange={(event) => setSelectedSubsidiaryId(event.target.value)} className="min-w-56 rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c6e911]">
                                    <option value="" disabled>{t('hr.selectSubsidiary')}</option>
                                    {subsidiaries.map((item) => <option key={item.id} value={item.id}>{item.subsidiaryName || item.name}</option>)}
                                </select>
                            </label>
                        )}
                        <div className="flex items-center flex-wrap gap-2 p-1 bg-slate-200 rounded-lg self-start sm:self-center">
                            <TabButton view="employees" label={t('hr.tabs.employees')} />
                            <TabButton view="pre-hire-training" label={t('hr.tabs.preHireTraining')} />
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
