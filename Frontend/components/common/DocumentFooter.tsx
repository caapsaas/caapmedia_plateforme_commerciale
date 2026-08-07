import React from 'react';
import { Subsidiary } from '../../types';

interface DocumentFooterProps {
    message?: string;
    showSignature?: boolean;
    customText?: string;
    // Quand fournie, affiche la barre d'informations légales de la filiale
    // (RCCM/IFU, coordonnées bancaires) en bas de page — calqué sur
    // Frontend_GMO/components/bons/FooterGMO.tsx (bande colorée en pied de
    // document), en version atténuée/claire plutôt que le bloc vert saturé
    // de gmo, pour rester dans l'identité "light" de caapmedia.
    subsidiary?: Subsidiary;
}

const DocumentFooter: React.FC<DocumentFooterProps> = ({
    message,
    showSignature = true,
    customText = 'CaapMedia Plateforme Commerciale',
    subsidiary,
}) => {
    const hasBankDetails = !!subsidiary?.bankDetails?.bankName;
    const hasFiscalInfo = !!(subsidiary?.rccm || subsidiary?.ifu);

    return (
        <div className="mt-8">
            {message && (
                <p className="text-sm text-slate-600 text-center leading-relaxed pt-6 border-t border-slate-200">
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

            {subsidiary && (hasFiscalInfo || hasBankDetails) && (
                // -mx-8 -mb-8 : bord à bord avec la page (compense le p-8 du
                // conteneur document, standard sur les 6 documents) — pas de
                // marge/espace flottant, comme la bande de FooterGMO chez gmo.
                <div className="mt-6 -mx-8 -mb-8 border-t-2 border-[#c6e911] bg-[#c6e911]/10 px-8 py-2.5 text-center text-[11px] text-slate-600 leading-relaxed">
                    {hasFiscalInfo && (
                        <p>
                            {subsidiary.rccm && <>RCCM : {subsidiary.rccm}</>}
                            {subsidiary.rccm && subsidiary.ifu && ' — '}
                            {subsidiary.ifu && <>IFU : {subsidiary.ifu}</>}
                        </p>
                    )}
                    {hasBankDetails && (
                        <p>
                            Compte bancaire : {subsidiary.bankDetails!.bankName}
                            {subsidiary.bankDetails!.accountNumber && ` — ${subsidiary.bankDetails!.accountNumber}`}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default DocumentFooter;
