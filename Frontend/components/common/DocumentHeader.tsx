import React from 'react';
import { Subsidiary } from '../../types';

interface DocumentHeaderProps {
    subsidiary: Subsidiary;
    usePublicContact?: boolean;
    // Affiche IFU/RCCM (identifiants fiscaux) — requis sur les factures,
    // pas nécessaire sur un bon de livraison/d'entrée.
    showFiscalInfo?: boolean;
}

// Logo réel de la plateforme, servi statiquement depuis Frontend/public —
// PAS subsidiary.logo (champ jamais peuplé, un composant React ne traverse
// pas le JSON de l'API) ni subsidiary.logoSvg (placeholder de seed
// inexploitable, "<svg>...</svg>" littéral). Un seul logo partagé par
// toutes les filiales (CaapMedia est la plateforme mère), pas un logo par
// filiale.
const LOGO_SRC = '/CaapMedia.png';

/**
 * En-tête de document imprimable — structure calquée sur gmo
 * (Frontend_GMO/components/bons/HeaderGMO.tsx) : logo à gauche, encadré
 * d'informations filiale à droite. Couleur volontairement atténuée (fond
 * teinté très clair, bordure fine) plutôt que le bloc vert saturé de gmo —
 * reste dans l'identité "light" de caapmedia.
 *
 * Le titre/référence propres à chaque document (Facture N°, Bon de commande
 * N°...) ne sont pas placés à côté de ce composant mais EN DESSOUS, pleine
 * largeur — même agencement que gmo (HeaderGMO puis InvoiceHeader séparément).
 */
const DocumentHeader: React.FC<DocumentHeaderProps> = ({ subsidiary, showFiscalInfo = false, usePublicContact = false }) => {
    const phone = usePublicContact ? '+237 671 89 01 84' : subsidiary.phone;
    const email = usePublicContact ? 'contact@caapmedia.com' : subsidiary.email;
    return (
        <div className="relative flex items-center gap-8 pb-5 mb-7 border-b border-slate-200 min-h-[7rem]">
            <div className="w-[28%] shrink-0 flex items-center justify-start">
                <img src={LOGO_SRC} alt="CaapMedia" className="max-h-24 max-w-full object-contain" />
            </div>

            <div className="flex-1 border-l-2 border-[#c6e911] pl-5 text-sm text-slate-600 leading-snug">
                <p className="font-bold text-base tracking-tight text-slate-900">{subsidiary.name}</p>
                {subsidiary.address && <p className="mt-1">{subsidiary.address}</p>}
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-slate-500">
                    {phone && <p>Tél : {phone}</p>}
                    {email && <p>Email : {email}</p>}
                </div>
                {showFiscalInfo && (subsidiary.ifu || subsidiary.rccm) && (
                    <div className="flex flex-wrap gap-x-4 mt-2 text-[11px] text-slate-500">
                        {subsidiary.ifu && <p>IFU : {subsidiary.ifu}</p>}
                        {subsidiary.rccm && <p>RCCM : {subsidiary.rccm}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentHeader;
