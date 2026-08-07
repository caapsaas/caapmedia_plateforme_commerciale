import React from 'react';

/**
 * Filigrane logo en fond de document imprimable (facture, bon de commande,
 * bon de livraison, bon d'entrée, proforma...) — calqué sur le pattern gmo
 * (Frontend_GMO/components/bons/Watermark.tsx). Logo statique partagé, voir
 * DocumentHeader.tsx pour la même remarque (pas de logo par filiale).
 *
 * À placer en premier enfant d'un conteneur `relative` (ou avec `position`
 * déjà gérée par le document parent) — s'étend en `absolute inset-0`.
 */
const DocumentWatermark: React.FC = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" aria-hidden="true">
        <img src="/CaapMedia.png" alt="" className="w-64 opacity-5" />
    </div>
);

export default DocumentWatermark;
