import React from 'react';
import { useI18n } from '../../i18n';
import { AlertTriangle, X } from '../ui/Icons';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmButtonText?: string;
    confirmButtonClass?: string;
    isDangerous?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmButtonText,
    confirmButtonClass,
    isDangerous = false
}) => {
    const { t } = useI18n();

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in fade-in zoom-in-95"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with Icon */}
                <div className={`px-6 py-8 ${isDangerous ? 'bg-gradient-to-r from-red-50 to-red-100/50' : 'bg-gradient-to-r from-blue-50 to-blue-100/50'} border-b border-slate-200`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isDangerous ? 'bg-red-100' : 'bg-blue-100'}`}>
                                <AlertTriangle size={24} color={isDangerous ? '#dc2626' : '#2563eb'} />
                            </div>
                            <div className="flex-1">
                                <h3 id="confirmation-title" className="text-xl font-bold text-slate-900">{title}</h3>
                                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{message}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors ml-2"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Footer with Actions */}
                <div className="px-6 py-4 bg-white flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={confirmButtonClass || (isDangerous
                            ? "px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm shadow-sm hover:shadow-md"
                            : "px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm hover:shadow-md"
                        )}
                    >
                        {confirmButtonText || t('common.confirmDelete')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
