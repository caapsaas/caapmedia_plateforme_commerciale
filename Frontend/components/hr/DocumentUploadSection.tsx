import React, { useRef } from 'react';
import { EmployeeDocument } from '../../types';
import { useI18n } from '../../i18n';
import { Plus, X, FileText, Download } from '../ui/Icons';
import Button from '../ui/Button';

interface DocumentUploadSectionProps {
  documents: {
    contract: EmployeeDocument | null;
    idCard: EmployeeDocument | null;
    workPermit: EmployeeDocument | null;
    diplomas: EmployeeDocument[];
  };
  onUpdate: (documents: any) => void;
}

const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  documents,
  onUpdate,
}) => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const diplomasInputRef = useRef<HTMLInputElement>(null);
  const [dragOverField, setDragOverField] = React.useState<string | null>(null);

  const documentFields = [
    { key: 'contract', label: t('hr.documents.contract'), icon: FileText },
    { key: 'idCard', label: t('hr.documents.idCard'), icon: FileText },
    { key: 'workPermit', label: t('hr.documents.workPermit'), icon: FileText },
  ];

  const handleFileSelect = (field: string, file: File) => {
    if (!file) return;

    // Validation de taille (max 5MB par fichier)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      alert(`File too large! Max size is 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Store file for later upload during employee save
    // On va uploader les fichiers quand l'employé sera créé
    const fileData = {
      name: file.name,
      url: '', // URL sera remplie après upload
      file: file, // Stocker le fichier pour l'upload ultérieur
    };

    if (field === 'diplomas') {
      onUpdate({
        ...documents,
        diplomas: [...(documents.diplomas || []), fileData],
      });
    } else {
      onUpdate({
        ...documents,
        [field]: fileData,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent, field: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverField(field);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverField(null);
  };

  const handleDrop = (e: React.DragEvent, field: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverField(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(field, files[0]);
    }
  };

  const handleRemoveDocument = (field: string, index?: number) => {
    if (field === 'diplomas' && index !== undefined) {
      onUpdate({
        ...documents,
        diplomas: (documents.diplomas || []).filter((_, i) => i !== index),
      });
    } else {
      onUpdate({
        ...documents,
        [field]: null,
      });
    }
  };

  const DocumentCard = ({ field, label }: { field: string; label: string }) => {
    const doc = documents[field as keyof typeof documents];
    const isDragOver = dragOverField === field;

    return (
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : doc
            ? 'border-green-300 bg-green-50'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        onDragOver={(e) => handleDragOver(e, field)}
        onDragLeave={(e) => handleDragLeave(e)}
        onDrop={(e) => handleDrop(e, field)}
      >
        {doc ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <FileText className="text-green-600" size={40} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 truncate text-sm">
                {doc.name}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {t('hr.documents.uploaded')}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <a
                href={doc.url}
                download={doc.name}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
              >
                <Download size={16} />
                {t('hr.documents.download')}
              </a>
              <button
                onClick={() => handleRemoveDocument(field)}
                className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-xs"
              >
                <X size={16} />
                {t('hr.documents.remove')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <FileText
              className="mx-auto text-slate-400"
              size={32}
            />
            <div>
              <p className="text-sm font-medium text-slate-900">{label}</p>
              <p className="text-xs text-slate-500 mt-1">
                {t('hr.documents.dragOrClick')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
            >
              <Plus size={16} />
              {t('hr.documents.selectFile')}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Single Document Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {documentFields.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {label}
            </label>
            <DocumentCard field={key} label={label} />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileSelect(key, e.target.files[0]);
                }
              }}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>
        ))}
      </div>

      {/* Diplomas Section */}
      <div className="border-t pt-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('hr.documents.diplomas')}
          </label>
          <p className="text-xs text-slate-500 mb-4">
            {t('hr.documents.diplomasHelper')}
          </p>

          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOverField === 'diplomas'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 hover:border-slate-400'
            }`}
            onDragOver={(e) => handleDragOver(e, 'diplomas')}
            onDragLeave={(e) => handleDragLeave(e)}
            onDrop={(e) => handleDrop(e, 'diplomas')}
          >
            <FileText className="mx-auto text-slate-400 mb-2" size={32} />
            <p className="text-sm font-medium text-slate-900">
              {t('hr.documents.addDiplomas')}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {t('hr.documents.dragOrClick')}
            </p>
            <button
              type="button"
              onClick={() => diplomasInputRef.current?.click()}
              className="mt-3 inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
            >
              <Plus size={16} />
              {t('hr.documents.selectFile')}
            </button>
            <input
              ref={diplomasInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileSelect('diplomas', e.target.files[0]);
                }
              }}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>
        </div>

        {/* Uploaded Diplomas List */}
        {documents.diplomas && documents.diplomas.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900">
              {t('hr.documents.uploadedDiplomas')} ({documents.diplomas.length})
            </h4>
            <div className="space-y-2">
              {(documents.diplomas || []).map((diploma, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText size={20} className="text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700 truncate">
                      {diploma.name}
                    </span>
                  </div>
                  <div className="flex gap-2 ml-2 flex-shrink-0">
                    <a
                      href={diploma.url}
                      download={diploma.name}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Download size={18} />
                    </a>
                    <button
                      onClick={() => handleRemoveDocument('diplomas', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-xs text-amber-800">
          {t('hr.documents.requirements')}
        </p>
      </div>
    </div>
  );
};

export default DocumentUploadSection;
