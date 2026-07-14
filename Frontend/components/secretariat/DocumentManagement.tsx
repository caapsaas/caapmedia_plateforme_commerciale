import React, { useState } from 'react';
import { Subsidiary, CompanyDocument, DocumentStatus } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import IconDownload from '../icons/IconDownload';
import DocumentFormModal from './DocumentFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';
import { getImageUrl } from '../../utils/imageUtils';

interface DocumentManagementProps {
    subsidiary: Subsidiary;
    documents: CompanyDocument[];
    onSave: (data: FormData) => void;
    onDelete: (id: string) => void;
}

const DocumentManagement: React.FC<DocumentManagementProps> = ({ subsidiary, documents, onSave, onDelete }) => {
    const { t } = useI18n();
    const toast = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<CompanyDocument | null>(null);
    const [deletingDocument, setDeletingDocument] = useState<CompanyDocument | null>(null);

    const handleOpenAddModal = () => {
        setEditingDocument(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (doc: CompanyDocument) => {
        setEditingDocument(doc);
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (doc: CompanyDocument) => {
        setDeletingDocument(doc);
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setDeletingDocument(null);
    };

    const handleSaveDocument = (data: FormData) => {
        try {
            onSave(data);
            const action = editingDocument ? 'modifié' : 'ajouté';
            toast.success('Document enregistré!', `Le document a été ${action} avec succès.`);
            handleCloseModals();
        } catch (error) {
            toast.error('Erreur de sauvegarde', 'Une erreur est survenue lors de la sauvegarde du document.');
        }
    };

    const handleDeleteDocument = () => {
        try {
            if (deletingDocument) {
                onDelete(deletingDocument.id);
                toast.success('Document supprimé!', 'Le document a été supprimé avec succès.');
                handleCloseModals();
            }
        } catch (error) {
            toast.error('Erreur de suppression', 'Une erreur est survenue lors de la suppression du document.');
        }
    };

    const getStatusClass = (status: DocumentStatus) => {
        switch (status) {
            case DocumentStatus.DRAFT: return 'bg-yellow-100 text-yellow-800';
            case DocumentStatus.FINAL: return 'bg-green-100 text-green-800';
            case DocumentStatus.ARCHIVED: return 'bg-slate-100 text-slate-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const handlePrint = () => {
        window.print();
        toast.info('Impression lancée', 'La page est en cours d\'impression.');
    };

    const handleExportCsv = () => {
        try {
            const headers = [
                { key: 'name', label: t('secretariat.documents.table.name') },
                { key: 'category', label: t('secretariat.documents.table.category') },
                { key: 'uploadDate', label: t('secretariat.documents.table.uploadDate') },
                { key: 'status', label: t('secretariat.documents.table.status') },
            ];
            const data = documents.map(d => ({
                ...d,
                category: t(`secretariat.documents.categories.${d.category}`),
                status: t(`secretariat.documents.statuses.${d.status}`),
            }));
            exportToCsv('liste_documents', headers, data);
            toast.success('Export CSV réussi!', 'Les données ont été exportées au format CSV.');
        } catch (error) {
            toast.error('Erreur d\'export', 'Une erreur est survenue lors de l\'export CSV.');
        }
    };

    const handleExportPdf = () => {
        try {
            const headers = [
                { key: 'name', label: t('secretariat.documents.table.name') },
                { key: 'category', label: t('secretariat.documents.table.category') },
                { key: 'uploadDate', label: t('secretariat.documents.table.uploadDate') },
                { key: 'status', label: t('secretariat.documents.table.status') },
            ];
            const data = documents.map(d => ({
                ...d,
                category: t(`secretariat.documents.categories.${d.category}`),
                status: t(`secretariat.documents.statuses.${d.status}`),
            }));
            exportToPdf(t('secretariat.documents.title'), headers, data, 'documents');
            toast.success('Export PDF réussi!', 'Les données ont été exportées au format PDF.');
        } catch (error) {
            toast.error('Erreur d\'export', 'Une erreur est survenue lors de l\'export PDF.');
        }
    };

    const handleDownloadDocument = (doc: CompanyDocument) => {
        try {
            const downloadUrl = getImageUrl(doc.fileUrl);
            if (!downloadUrl) {
                toast.error('Erreur de téléchargement', 'L\'URL du document n\'est pas disponible.');
                return;
            }
            
            // Vérifier si l'URL se termine par une extension de fichier valide
            const validExtensions = ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.jpg', '.png', '.txt'];
            const hasValidExtension = validExtensions.some(ext => doc.fileUrl.toLowerCase().endsWith(ext));
            
            if (!hasValidExtension) {
                toast.error('Erreur de téléchargement', 'Le type de fichier n\'est pas supporté.');
                return;
            }
            
            // Créer un lien temporaire pour le téléchargement
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.target = '_blank';
            
            // Utiliser le nom du document avec l'extension correcte pour le téléchargement
            const fileExtension = doc.fileUrl.split('.').pop();
            const downloadName = doc.name.includes(`.${fileExtension}`) 
                ? doc.name 
                : `${doc.name}.${fileExtension}`;
            
            link.download = downloadName;
            link.rel = 'noopener noreferrer';
            
            // Déclencher le téléchargement
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success('Téléchargement démarré', `Le document "${doc.name}" est en cours de téléchargement.`);
        } catch (error) {
            console.error('Erreur de téléchargement:', error);
            toast.error('Erreur de téléchargement', 'Une erreur est survenue lors du téléchargement du document.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('secretariat.documents.title')}</h3>
                <div className="flex items-center space-x-2 no-print">
                    <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                        <IconPlus className="h-4 w-4" />
                        <span>{t('secretariat.documents.add')}</span>
                    </button>
                    <button onClick={handlePrint} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        <IconPrint className="h-4 w-4" />
                        <span>{t('common.print')}</span>
                    </button>
                    <button onClick={handleExportCsv} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        <IconExport className="h-4 w-4" />
                        <span>{t('common.export')}</span>
                    </button>
                    <button onClick={handleExportPdf} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        <IconPdf className="h-4 w-4" />
                        <span>{t('common.exportPdf')}</span>
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('secretariat.documents.table.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('secretariat.documents.table.category')}</th>
                            <th scope="col" className="px-6 py-3">{t('secretariat.documents.table.uploadDate')}</th>
                            <th scope="col" className="px-6 py-3">{t('secretariat.documents.table.status')}</th>
                            <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map((doc) => (
                            <tr key={doc.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{doc.name}</td>
                                <td className="px-6 py-4">{t(`secretariat.documents.categories.${doc.category}`)}</td>
                                <td className="px-6 py-4">{doc.uploadDate}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(doc.status)}`}>
                                        {t(`secretariat.documents.statuses.${doc.status}`)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center space-x-1 no-print">
                                    <button onClick={() => handleDownloadDocument(doc)} className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-100 rounded-full transition-colors" aria-label={t('hr.absences.table.download')}>
                                        <IconDownload className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenEditModal(doc)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                        <IconEdit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenDeleteModal(doc)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
                                        <IconDelete className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <DocumentFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSaveDocument}
                    document={editingDocument}
                />
            )}

            {deletingDocument && (
                <ConfirmationModal
                    isOpen={!!deletingDocument}
                    onClose={handleCloseModals}
                    onConfirm={handleDeleteDocument}
                    title={t('secretariat.documents.modal.deleteTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: deletingDocument.name })}
                />
            )}
        </div>
    );
};

export default DocumentManagement;