import React from 'react';
import { useI18n } from '../../i18n';

interface ViewSignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    signatureUrl: string;
    name: string;
}

const ViewSignatureModal: React.FC<ViewSignatureModalProps> = ({ isOpen, onClose, signatureUrl, name }) => {
    const { t } = useI18n();
    
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
            role="dialog"
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b">
                    <h3 className="text-lg font-bold text-slate-900">{t('configuration.modal.viewSignatureTitle', {name})}</h3>
                </div>
                <div className="p-4">
                    <img src={signatureUrl} alt={`Signature of ${name}`} className="w-full h-auto border border-slate-200 rounded-md" />
                </div>
                <div className="px-4 py-3 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewSignatureModal;
