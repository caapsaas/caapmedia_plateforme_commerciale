import React, { useState } from 'react';
import { Subsidiary, Employee } from '../types';
import { useI18n } from '../i18n';
import DocumentManagement from '../components/secretariat/DocumentManagement';
import MeetingManagement from '../components/secretariat/MeetingManagement';
import TaskManagement from '../components/secretariat/TaskManagement';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<SecretariatView>('documents');
    
    // --- Data fetching with TanStack Query ---
    const { data: documents = [], isLoading: isLoadingDocs } = useQuery({ queryKey: ['documents', subsidiary.id], queryFn: getCompanyDocuments });
    const { data: meetings = [], isLoading: isLoadingMeetings } = useQuery({ queryKey: ['meetings', subsidiary.id], queryFn: getMeetings });
    const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({ queryKey: ['secretariatTasks', subsidiary.id], queryFn: getSecretariatTasks });
    const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({ queryKey: ['employees', subsidiary.id], queryFn: () => getEmployees() });

    // --- Mutations ---
    // Note: The save logic for documents is split into create and update due to file handling.
    // The DocumentManagement component will need to decide which to call.
    // For simplicity, we can create a wrapper here.
    const onSaveDocument = (data: any) => {
        return data.id ? updateCompanyDocument(data.id, data) : createCompanyDocument(data);
    };
    const { mutate: saveDocumentMutation } = useMutation({ mutationFn: onSaveDocument, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }) });
    const { mutate: onDeleteDocument } = useMutation({ mutationFn: deleteCompanyDocument, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }) });

    const { mutate: onSaveMeeting } = useMutation({ mutationFn: saveMeeting, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }) });
    const { mutate: onDeleteMeeting } = useMutation({ mutationFn: deleteMeeting, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }) });

    const { mutate: onSaveTask } = useMutation({ mutationFn: saveSecretariatTask, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['secretariatTasks'] }) });
    const { mutate: onDeleteTask } = useMutation({ mutationFn: deleteSecretariatTask, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['secretariatTasks'] }) });

    const isLoading = isLoadingDocs || isLoadingMeetings || isLoadingTasks || isLoadingEmployees;

    const renderActiveView = () => {
        if (isLoading) {
            return <div className="p-6 text-center">{t('common.loading')}</div>;
        }

        switch (activeTab) {
            case 'documents':
                return <DocumentManagement 
                            subsidiary={subsidiary} 
                            documents={documents}
                            onSave={saveDocumentMutation}
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
                            onSave={saveDocumentMutation}
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