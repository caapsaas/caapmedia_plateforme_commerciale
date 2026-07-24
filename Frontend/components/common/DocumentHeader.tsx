import React from 'react';
import { Subsidiary } from '../../types';
import { useI18n } from '../../i18n';
import IconMapPin from '../icons/IconMapPin';
import IconPhone from '../icons/IconPhone';
import IconMail from '../icons/IconMail';

interface DocumentHeaderProps {
    subsidiary: Subsidiary;
    showContactIcons?: boolean;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ subsidiary, showContactIcons = true }) => {
    const { t } = useI18n();
    const LogoComponent = subsidiary.logo;

    return (
        <div className="flex justify-between items-start mb-8 pb-6 border-b-4 border-[#c6e911]">
            {/* Logo & Company Info */}
            <div>
                {LogoComponent && <LogoComponent className="h-16 w-auto" />}
                <p className="font-bold text-xl mt-4 text-slate-900">{subsidiary.name}</p>

                {/* Contact Info */}
                <div className="mt-4 space-y-1 text-sm text-slate-600">
                    {subsidiary.address && (
                        <div className="flex items-start gap-2">
                            {showContactIcons && <IconMapPin className="h-4 w-4 mt-0.5 text-[#c6e911] flex-shrink-0" />}
                            <p>{subsidiary.address}</p>
                        </div>
                    )}
                    {subsidiary.phone && (
                        <div className="flex items-center gap-2">
                            {showContactIcons && <IconPhone className="h-4 w-4 text-[#c6e911] flex-shrink-0" />}
                            <a href={`tel:${subsidiary.phone}`} className="hover:text-[#c6e911] transition-colors">
                                {subsidiary.phone}
                            </a>
                        </div>
                    )}
                    {subsidiary.email && (
                        <div className="flex items-center gap-2">
                            {showContactIcons && <IconMail className="h-4 w-4 text-[#c6e911] flex-shrink-0" />}
                            <a href={`mailto:${subsidiary.email}`} className="hover:text-[#c6e911] transition-colors">
                                {subsidiary.email}
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Document Info (Right side) */}
            <div className="text-right" id="document-header-right">
                {/* Will be populated by document-specific content */}
            </div>
        </div>
    );
};

export default DocumentHeader;
