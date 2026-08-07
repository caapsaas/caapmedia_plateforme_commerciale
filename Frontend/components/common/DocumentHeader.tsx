import React from 'react';
import { Subsidiary } from '../../types';

interface DocumentHeaderProps {
    subsidiary: Subsidiary;
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
const DocumentHeader: React.FC<DocumentHeaderProps> = ({ subsidiary, showFiscalInfo = false }) => {
    return (
        <div className="flex items-stretch gap-6 pb-6 mb-6 border-b border-slate-200 min-h-[7rem]">
            <div className="w-1/3 flex items-center justify-center">
                <img src={LOGO_SRC} alt="CaapMedia" className="max-h-24 max-w-full object-contain" />
            </div>

            <div className="w-2/3 rounded-lg border border-[#c6e911]/40 bg-[#c6e911]/5 p-4 flex flex-col justify-center text-sm text-slate-700 leading-snug">
                <p className="font-bold text-base text-slate-900">{subsidiary.name}</p>
                {subsidiary.address && <p>{subsidiary.address}</p>}
                <div className="flex flex-wrap gap-x-4 mt-1">
                    {subsidiary.phone && (
                        <p><span className="font-semibold">Tél :</span> {subsidiary.phone}</p>
                    )}
                    {subsidiary.email && (
                        <p><span className="font-semibold">Email :</span> {subsidiary.email}</p>
                    )}
                </div>
                {showFiscalInfo && (subsidiary.ifu || subsidiary.rccm) && (
                    <div className="flex flex-wrap gap-x-4 mt-1 text-xs text-slate-500">
                        {subsidiary.ifu && <p>IFU : {subsidiary.ifu}</p>}
                        {subsidiary.rccm && <p>RCCM : {subsidiary.rccm}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentHeader;
