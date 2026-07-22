import React, { useRef } from 'react';
import { EmployeeDocument } from '../../types';
import { useI18n } from '../../i18n';
import { Plus, X, FileText, Download, CheckCircle, AlertTriangle } from '../ui/Icons';
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
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const diplomasInputRef = useRef<HTMLInputElement>(null);
  const [dragOverField, setDragOverField] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  const documentFields = [
    {
      key: 'contract',
      label: t('hr.documents.contract'),
      description: t('hr.documents.contractDesc')
    },
    {
      key: 'idCard',
      label: t('hr.documents.idCard'),
      description: t('hr.documents.idCardDesc')
    },
    {
      key: 'workPermit',
      label: t('hr.documents.workPermit'),
      description: t('hr.documents.workPermitDesc')
    },
  ];

  const validateFile = (file: File): string | null => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg'];

    if (file.size > MAX_SIZE) {
      return `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(2)}MB). Max: 10MB`;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Format non autorisé. Acceptés: PDF, DOC, DOCX, JPG, PNG';
    }

    return null;
  };

  const handleFileSelect = (field: string, file: File) => {
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
      return;
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });

    const fileData = {
      name: file.name,
      file: file,
      size: file.size,
      uploadedAt: new Date().toISOString(),
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const DocumentCard = ({ field, label, description }: { field: string; label: string; description?: string }) => {
    const doc = documents[field as keyof typeof documents];
    const isDragOver = dragOverField === field;
    const hasError = errors[field];

    return (
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 shadow-md'
            : doc
            ? 'border-green-300 bg-green-50 shadow-sm'
            : hasError
            ? 'border-red-300 bg-red-50'
            : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50'
        }`}
        onDragOver={(e) => handleDragOver(e, field)}
        onDragLeave={(e) => handleDragLeave(e)}
        onDrop={(e) => handleDrop(e, field)}
      >
        {hasError && (
          <div className="absolute top-2 right-2">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
        )}

        {doc ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="relative">
                <FileText className="text-green-600" size={40} />
                <CheckCircle size={20} className="text-green-600 absolute bottom-0 right-0" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-900 truncate text-sm">
                {doc.name}
              </p>
              {doc.size && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatFileSize(doc.size)}
                </p>
              )}
              <p className="text-xs text-green-600 font-medium mt-1">
                ✓ {t('hr.documents.fileSelected')}
              </p>
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              {(doc as any).file && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  {t('hr.documents.toUpload')}
                </span>
              )}
              <button
                onClick={() => handleRemoveDocument(field)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200 transition"
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
              size={40}
            />
            <div>
              <p className="text-sm font-medium text-slate-900">{label}</p>
              {description && (
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                {t('hr.documents.dragDrop')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRefs.current[field]?.click()}
              className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              <Plus size={16} />
              {t('hr.documents.selectFile')}
            </button>
          </div>
        )}

        {hasError && (
          <div className="text-xs text-red-600 mt-2 font-medium">
            {hasError}
          </div>
        )}

        <input
          ref={(el) => { if (el) fileInputRefs.current[field] = el; }}
          type="file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileSelect(field, e.target.files[0]);
            }
          }}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Single Document Fields */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          {t('hr.documents.mainDocuments')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {documentFields.map(({ key, label, description }) => (
            <div key={key}>
              <DocumentCard field={key} label={label} description={description} />
            </div>
          ))}
        </div>
      </div>

      {/* Diplomas Section */}
      <div className="border-t pt-8">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-2">
            {t('hr.documents.diplomasTitle')}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {t('hr.documents.diplomasHelper')}
          </p>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              dragOverField === 'diplomas'
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50'
            }`}
            onDragOver={(e) => handleDragOver(e, 'diplomas')}
            onDragLeave={(e) => handleDragLeave(e)}
            onDrop={(e) => handleDrop(e, 'diplomas')}
          >
            <FileText className="mx-auto text-slate-400 mb-3" size={40} />
            <p className="text-sm font-medium text-slate-900">
              {t('hr.documents.addDiplomas')}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {t('hr.documents.dragDrop')}
            </p>
            <button
              type="button"
              onClick={() => diplomasInputRef.current?.click()}
              className="mt-4 inline-flex items-center gap-1 px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              <Plus size={16} />
              {t('hr.documents.addDiploma')}
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
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle size={18} className="text-green-600" />
              {t('hr.documents.uploaddedDiplomas')} ({documents.diplomas.length})
            </h4>
            <div className="space-y-2">
              {(documents.diplomas || []).map((diploma, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-green-50 border border-green-200 rounded-lg hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {diploma.name}
                      </p>
                      {diploma.size && (
                        <p className="text-xs text-slate-500">
                          {formatFileSize(diploma.size)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-2 flex-shrink-0">
                    <button
                      onClick={() => handleRemoveDocument('diplomas', index)}
                      className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition"
                      title={t('hr.documents.removeDocument')}
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertTriangle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900 mb-1">
            {t('hr.documents.acceptedFormats')}
          </p>
          <p className="text-xs text-blue-800">
            {t('hr.documents.formatInfo')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadSection;
