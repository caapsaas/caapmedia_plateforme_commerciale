import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CompanyDocument, DocumentCategory, DocumentStatus } from '../../types';
import { useI18n } from '../../i18n';

interface DocumentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: FormData) => void;
    document: CompanyDocument | null;
}

const DocumentFormModal: React.FC<DocumentFormModalProps> = ({ isOpen, onClose, onSave, document }) => {
    const { t } = useI18n();
    const initialFormState = {
        documentName: '',
        category: DocumentCategory.OTHER,
        status: DocumentStatus.DRAFT,
        uploadDate: new Date().toISOString().split('T')[0],
    };
    
    const [formData, setFormData] = useState(initialFormState);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (document) {
            setFormData({
                documentName: document.name,
                category: document.category,
                status: document.status,
                uploadDate: document.uploadDate
            });
        } else {
            setFormData(initialFormState);
        }
        setFile(null); // Réinitialiser le fichier à chaque ouverture
    }, [document, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };
    
    const { subsidiary } = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = new FormData();
        if (document?.id) {
            data.append('id', document.id);
        }
        data.append('documentName', formData.documentName);
        data.append('category', formData.category);
        data.append('status', formData.status);
        data.append('uploadDate', formData.uploadDate);
        if (file) data.append('file', file);
         if (subsidiary?.id) {
            data.append('subsidiaryId', subsidiary.id);
        } else {
            console.warn("⚠️ Aucun subsidiary trouvé dans le contexte Auth !");
        }
        onSave(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            {document ? t('secretariat.documents.modal.editTitle') : t('secretariat.documents.modal.addTitle')}
                        </h3>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="documentName" className="block text-sm font-medium text-slate-700">{t('secretariat.documents.table.name')}</label>
                                <input type="text" name="documentName" id="documentName" value={formData.documentName} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-slate-700">{t('secretariat.documents.table.category')}</label>
                                    <select name="category" id="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        {Object.values(DocumentCategory).map(cat => <option key={cat} value={cat}>{t(`secretariat.documents.categories.${cat}`)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-slate-700">{t('secretariat.documents.table.status')}</label>
                                    <select name="status" id="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        {Object.values(DocumentStatus).map(s => <option key={s} value={s}>{t(`secretariat.documents.statuses.${s}`)}</option>)}
                                    </select>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700">{t('configuration.form.document')}</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div className="flex text-sm text-slate-600">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#c6e911] hover:text-[#adc40f] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#c6e911]">
                                                <span>{t('configuration.form.uploadFile')}</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                            </label>
                                        </div>
                                        {file ? <p className="text-xs text-slate-500">{file.name}</p> : (document?.fileUrl && <p className="text-xs text-slate-500">{document.fileUrl.split('/').pop()}</p>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors">{t('common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DocumentFormModal;