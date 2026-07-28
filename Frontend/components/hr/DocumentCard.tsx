import React from 'react';
import { Download } from '../ui/Icons';
import { t } from 'i18next';

interface DocumentCardProps {
  /** i18n key for the document label, e.g., 'hr.details.contract' */
  labelKey: string;
  /** Document object containing name and url */
  document: { name: string; url: string } | null;
  /** Icon component to display (e.g., FileText, Card) */
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Optional background color class (e.g., 'bg-blue-50') */
  bgClass?: string;
}

/** Reusable card for rendering employee documents with download */
const DocumentCard: React.FC<DocumentCardProps> = ({ labelKey, document, Icon, bgClass = 'bg-blue-50' }) => {
  if (!document) return null;
  const { name, url } = document;
  return (
    <div className={`border rounded-lg p-4 flex items-center justify-between ${bgClass} transition-colors group`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <Icon size={20} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{t(labelKey)}</p>
          <p className="text-xs text-slate-600 mt-0.5 truncate">{name}</p>
        </div>
      </div>
      {url && (
        <a
          href={url}
          download={name}
          className="ml-2 p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
          title={t('hr.documents.download')}
        >
          <Download size={18} />
        </a>
      )}
    </div>
  );
};

export default DocumentCard;
