import React from 'react';
import { useI18n } from '../../i18n';
import { Subsidiary } from '../../types';

interface DocumentHeaderProps {
    subsidiary: Pick<Subsidiary, 'name' | 'address' | 'phone' | 'email' | 'ifu' | 'rccm'>;
    usePublicContact?: boolean;
    // Affiche IFU/RCCM (identifiants fiscaux) — requis sur les factures,
    // pas nécessaire sur un bon de livraison/d'entrée.
    showFiscalInfo?: boolean;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ subsidiary, showFiscalInfo = false, usePublicContact = false }) => {
    const { t } = useI18n();
    const phone = usePublicContact ? '+237 671 89 01 84' : subsidiary.phone;
    const email = usePublicContact ? 'contact@caapmedia.com' : subsidiary.email;
    return (
        <header className="relative mb-7 border-b border-[#aeca30] pb-4 pt-6">
            <div aria-hidden="true" className="absolute right-0 top-0 flex h-4 w-1/2">
                <span className="border-b-[16px] border-l-[28px] border-b-[#aeca30] border-l-transparent" />
                <span className="flex-1 bg-[#aeca30]" />
            </div>
            <div className="flex items-center gap-3">
                <span aria-hidden="true" className="absolute left-0 h-8 w-5 bg-[#459d36]" />
                <img src="/CaapMedia.png" alt="" className="relative ml-4 h-16 w-16 shrink-0 object-contain" />
                <div className="text-center leading-snug">
                    <p className="font-serif text-[30px] font-bold text-[#377f2c]">CAAP - GROUPE Sarl</p>
                    <p className="text-xs uppercase tracking-wide text-slate-900">{t('documentHeader.printServices')}</p>
                    <p className="text-xs uppercase text-slate-900">{t('documentHeader.otherServices')}</p>
                    <p className="font-serif text-sm font-semibold text-[#377f2c]">{t('documentHeader.tagline')}</p>
                </div>
            </div>
            <div className="mt-3 text-right text-xs leading-snug text-slate-700">
                <p className="font-bold text-sm text-slate-900">{subsidiary.name}</p>
                {subsidiary.address && <p className="mt-1">{subsidiary.address}</p>}
                <div className="flex flex-wrap justify-end gap-x-5 gap-y-1 mt-2 text-xs text-slate-500">
                    {phone && <p>{t('documentHeader.phone')} {phone}</p>}
                    {email && <p>{t('documentHeader.email')} {email}</p>}
                </div>
                {showFiscalInfo && (subsidiary.ifu || subsidiary.rccm) && (
                    <div className="flex flex-wrap justify-end gap-x-4 mt-2 text-[11px] text-slate-500">
                        {subsidiary.ifu && <p>IFU : {subsidiary.ifu}</p>}
                        {subsidiary.rccm && <p>RCCM : {subsidiary.rccm}</p>}
                    </div>
                )}
            </div>
        </header>
    );
};

export default DocumentHeader;
