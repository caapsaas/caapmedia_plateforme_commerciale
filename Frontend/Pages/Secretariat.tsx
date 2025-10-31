import React, { useState } from 'react';
import { Subsidiary, Employee, CompanyDocument, Meeting, SecretariatTask } from '../types';
import { useI18n } from '../i18n';
import { useAppContext } from '../context/AppContext';
import DocumentManagement from '../components/secretariat/DocumentManagement';
import MeetingManagement from '../components/secretariat/MeetingManagement';
import TaskManagement from '../components/secretariat/TaskManagement';
import {
    SaveMeetingDto,
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
    SaveSecretariatTaskDto,
} from '../services/apisecretariat/apiSecretariat';
import { getEmployees } from '../services/apihr/apiEmployees';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

type SecretariatView = 'documents' | 'meetings' | 'tasks';

const Secretariat: React.FC = () => {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const { subsidiary } = useAuth();
    const [activeTab, setActiveTab] = useState<SecretariatView>('documents');

    if (!subsidiary) {
        return <div className="p-6 text-center">{t('common.loading')}</div>;
    }

    const queryKey = (key: string) => [key, subsidiary.id];

    // --- Data Fetching ---
    const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<CompanyDocument[]>({
        queryKey: queryKey('companyDocuments'),
        queryFn: getCompanyDocuments
    });
    const { data: meetings = [], isLoading: isLoadingMeetings } = useQuery<Meeting[]>({
        queryKey: queryKey('meetings'),
        queryFn: getMeetings
    });
    const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<SecretariatTask[]>({
        queryKey: queryKey('secretariatTasks'),
        queryFn: getSecretariatTasks
    });
    const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({
        queryKey: queryKey('employees'),
        queryFn: () => getEmployees()
    });

    // --- Mutations ---
    const { mutate: onSaveDocument } = useMutation({
        mutationFn: (data: FormData) => data.get('id') ? updateCompanyDocument(data.get('id') as string, data) : createCompanyDocument(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('companyDocuments') })
    });
    const { mutate: onDeleteDocument } = useMutation({
        mutationFn: deleteCompanyDocument,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('companyDocuments') })
    });
    const { mutate: onSaveMeeting } = useMutation({
        mutationFn: (data: SaveMeetingDto) => saveMeeting(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('meetings') })
    });
    const { mutate: onDeleteMeeting } = useMutation({
        mutationFn: deleteMeeting,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('meetings') })
    });
    const { mutate: onSaveTask } = useMutation({
        mutationFn: (data: SaveSecretariatTaskDto) => saveSecretariatTask(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('secretariatTasks') })
    });
    const { mutate: onDeleteTask } = useMutation({
        mutationFn: deleteSecretariatTask,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey('secretariatTasks') })
    });

    const isLoading = isLoadingDocuments || isLoadingMeetings || isLoadingTasks || isLoadingEmployees;

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