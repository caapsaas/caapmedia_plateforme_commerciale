import React, { useState } from 'react';
import { Subsidiary } from '../types';
import { useI18n } from '../i18n';
import DocumentManagement from './secretariat/DocumentManagement';
import MeetingManagement from './secretariat/MeetingManagement';
import TaskManagement from './secretariat/TaskManagement';

type SecretariatView = 'documents' | 'meetings' | 'tasks';

interface SecretariatProps {
    subsidiary: Subsidiary;
}

const Secretariat: React.FC<SecretariatProps> = ({ subsidiary }) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<SecretariatView>('documents');

    const renderActiveView = () => {
        const props = { subsidiary };
        switch (activeTab) {
            case 'documents':
                return <DocumentManagement {...props} />;
            case 'meetings':
                return <MeetingManagement {...props} />;
            case 'tasks':
                return <TaskManagement {...props} />;
            default:
                return <DocumentManagement {...props} />;
        }
    };

    const TabButton: React.FC<{ view: SecretariatView; label: string }> = ({ view, label }) => (
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
                <h2 className="text-3xl font-bold text-slate-800">{t('secretariat.title')}</h2>
                <div className="flex items-center flex-wrap gap-2 p-1 bg-slate-200 rounded-lg self-start sm:self-center">
                    <TabButton view="documents" label={t('secretariat.tabs.documents')} />
                    <TabButton view="meetings" label={t('secretariat.tabs.meetings')} />
                    <TabButton view="tasks" label={t('secretariat.tabs.tasks')} />
                </div>
            </div>
            
            <div>
                {renderActiveView()}
            </div>
        </div>
    );
};

export default Secretariat;