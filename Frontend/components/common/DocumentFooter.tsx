import React from 'react';
import { useI18n } from '../../i18n';

interface DocumentFooterProps {
    message?: string;
    showSignature?: boolean;
    customText?: string;
}

const DocumentFooter: React.FC<DocumentFooterProps> = ({
    message,
    showSignature = true,
    customText = 'CaapMedia Plateforme Commerciale'
}) => {
    const { t } = useI18n();

    return (
        <div className="border-t-4 border-[#c6e911] pt-8 mt-8">
            {message && (
                <p className="text-sm text-slate-600 text-center leading-relaxed">
                    {message}
                </p>
            )}

            {showSignature && (
                <>
                    <p className="text-xs text-slate-400 text-center mt-6">
                        ___________________________________________________________
                    </p>
                    <p className="text-xs text-slate-400 text-center mt-2">
                        {customText}
                    </p>
                </>
            )}
        </div>
    );
};

export default DocumentFooter;
