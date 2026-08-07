import React from 'react';
import { Order } from '../../types';
import OrderDetailsPanel from './OrderDetailsPanel';

interface ProductionOrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

// Fine enveloppe autour du panneau de détail partagé (voir
// OrderDetailsPanel.tsx) — historiquement un modal minimal (specs
// uniquement), maintenant le même détail complet (infos générales, résumé
// financier, options/specs/fichier BAT/workflow production par ligne,
// historique) que Sales.tsx "Voir détails" et la file de validation
// production, en lecture seule (pas d'actions valider/rejeter ici).
const ProductionOrderDetailsModal: React.FC<ProductionOrderDetailsModalProps> = ({ isOpen, onClose, order }) => {
    if (!isOpen || !order) return null;
    return <OrderDetailsPanel order={order} onClose={onClose} />;
};

export default ProductionOrderDetailsModal;
