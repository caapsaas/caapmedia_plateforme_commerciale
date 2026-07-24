import React from 'react';
import { Order } from '../../types';
import { useI18n } from '../../i18n';
import SpecValuesSummary from '../common/SpecValuesSummary';

interface ProductionOrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

// Détail d'une commande côté production (Chantier 5) : affiche, pour chaque
// ligne, les spécifications techniques visibles par la production
// (visibleToProduction) figées à la commande — pas un formulaire de saisie,
// juste ce dont l'atelier a besoin pour fabriquer.
const ProductionOrderDetailsModal: React.FC<ProductionOrderDetailsModalProps> = ({ isOpen, onClose, order }) => {
    const { t } = useI18n();

    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-lg font-bold text-slate-900">{order.id}</h3>
                    <p className="text-sm text-slate-500">{order.customerName}</p>
                </div>
                <div className="p-6 space-y-4">
                    {order.orderItems.map((item, index) => (
                        <div key={index} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                            <p className="font-semibold text-slate-800">{item.quantity}x {item.product.name}</p>
                            <SpecValuesSummary
                                schema={item.specSnapshot}
                                values={item.specValues}
                                audience="production"
                                className="mt-2 space-y-1 text-sm text-slate-600"
                            />
                        </div>
                    ))}
                </div>
                <div className="px-6 py-4 bg-slate-50 flex justify-end rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.close')}</button>
                </div>
            </div>
        </div>
    );
};

export default ProductionOrderDetailsModal;
