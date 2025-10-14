import React, { useState, useEffect } from 'react';
import { Subsidiary, Employee, CompanyDocument, Meeting, SecretariatTask } from '../types';
import { useI18n } from '../i18n';
import DocumentManagement from '../components/secretariat/DocumentManagement';
import MeetingManagement from '../components/secretariat/MeetingManagement';
import TaskManagement from '../components/secretariat/TaskManagement';
import {
    getCompanyDocuments,
    createCompanyDocument,
    updateCompanyDocument,
    deleteCompanyDocument,
    getMeetings,
    saveMeeting,
    deleteMeeting,
    getSecretariatTasks,
    saveSecretariatTask,
    deleteSecretariatTask,
} from '../services/apisecretariat/apiSecretariat';
import { getEmployees } from '../services/apihr/apiEmployees';

type SecretariatView = 'documents' | 'meetings' | 'tasks';

interface SecretariatProps {
    subsidiary: Subsidiary;
}

const Secretariat: React.FC<SecretariatProps> = ({ subsidiary }) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<SecretariatView>('documents');
    
    // --- State Management with useState (like LoginPage.tsx) ---
    const [documents, setDocuments] = useState<CompanyDocument[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [tasks, setTasks] = useState<SecretariatTask[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Data Fetching with useEffect (like LoginPage.tsx) ---
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch all data in parallel
            const [docs, meets, tks, emps] = await Promise.all([
                getCompanyDocuments(),
                getMeetings(),
                getSecretariatTasks(),
                getEmployees()
            ]);
            setDocuments(docs);
            setMeetings(meets);
            setTasks(tks);
            setEmployees(emps);
        } catch (err: any) {
            setError(err.message || t('common.error.generic'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [subsidiary.id]); // Refetch if subsidiary changes

    // --- Manual Mutation Handlers (like LoginPage.tsx) ---
    const onSaveDocument = async (data: any) => {
        await (data.id ? updateCompanyDocument(data.id, data) : createCompanyDocument(data));
        fetchData(); // Manually refetch data
    };
    const onDeleteDocument = async (id: string) => {
        await deleteCompanyDocument(id);
        fetchData(); // Manually refetch data
    };

    const onSaveMeeting = async (data: any) => {
        await saveMeeting(data);
        fetchData(); // Manually refetch data
    };
    const onDeleteMeeting = async (id: string) => {
        await deleteMeeting(id);
        fetchData(); // Manually refetch data
    };

    const onSaveTask = async (data: any) => {
        await saveSecretariatTask(data);
        fetchData(); // Manually refetch data
    };
    const onDeleteTask = async (id: string) => {
        await deleteSecretariatTask(id);
        fetchData(); // Manually refetch data
    };

    const renderActiveView = () => {
        if (isLoading) {
            return <div className="p-6 text-center">{t('common.loading')}</div>;
        }

        switch (activeTab) {
            case 'documents':
                return <DocumentManagement 
                            subsidiary={subsidiary} 
                            documents={documents}
                            onSave={onSaveDocument}
                            onDelete={onDeleteDocument}
                        />;
            case 'meetings':
                return <MeetingManagement 
                            subsidiary={subsidiary}
                            meetings={meetings}
                            employees={employees}
                            onSave={onSaveMeeting}
                            onDelete={onDeleteMeeting}
                        />;
            case 'tasks':
                return <TaskManagement 
                            subsidiary={subsidiary}
                            tasks={tasks}
                            employees={employees}
                            onSave={onSaveTask}
                            onDelete={onDeleteTask}
                        />;
            default:
                return <DocumentManagement 
                            subsidiary={subsidiary} 
                            documents={documents}
                            onSave={onSaveDocument}
                            onDelete={onDeleteDocument}
                        />;
        }
    };

    /**
     * Un sous-composant pour afficher un bouton d'onglet.
     * @param {object} props - Les props du bouton.
     * @param {SecretariatView} props.view - La vue associée à ce bouton.
     * @param {string} props.label - Le texte à afficher sur le bouton.
     */
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