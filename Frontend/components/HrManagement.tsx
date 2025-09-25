import React, { useState } from 'react';
import { Subsidiary } from '../types';
import { useI18n } from '../i18n';
import EmployeeDatabase from './hr/EmployeeDatabase';
import AttendanceManagement from './hr/AttendanceManagement';
import PayrollManagement from './hr/PayrollManagement';
import AbsenceManagement from './hr/AbsenceManagement';

type HrView = 'employees' | 'attendance' | 'payroll' | 'absences';

interface HrManagementProps {
    subsidiary: Subsidiary;
}

const HrManagement: React.FC<HrManagementProps> = ({ subsidiary }) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<HrView>('employees');

    const renderActiveView = () => {
        const props = { subsidiary };
        switch (activeTab) {
            case 'employees':
                return <EmployeeDatabase {...props} />;
            case 'attendance':
                return <AttendanceManagement {...props} />;
            case 'payroll':
                return <PayrollManagement {...props} />;
            case 'absences':
                return <AbsenceManagement {...props} />;
            default:
                return <EmployeeDatabase {...props} />;
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