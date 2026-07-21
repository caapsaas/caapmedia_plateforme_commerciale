import React from 'react';
import { Order, UserRole } from '../../types';
import { useHasRole } from '../../hooks/useHasRole';
import { useI18n } from '../../i18n';
import IconStock from '../icons/IconStock';

interface ProductionOrderCardProps {
    order: Order;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onWithdrawMaterials: (orderId: string) => void;
    onViewDetails: (order: Order) => void;
}

// "Prélever les matières" (Chantier 3) : réservé au responsable de production
// existant (+ Admin) — pas de nouveau rôle "Magasinier" pour ce chantier.
const WITHDRAW_ROLES = [UserRole.PRODUCTION_DIRECTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN];

const ProductionOrderCard: React.FC<ProductionOrderCardProps> = ({ order, onDragStart, onWithdrawMaterials, onViewDetails }) => {
    const { t } = useI18n();
    const { hasRole } = useHasRole();

    const itemSummary = order.orderItems.map(item => `${item.quantity}x ${item.product.name}`).join(', ');

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onClick={() => onViewDetails(order)}
            className="bg-white rounded-md shadow p-4 border-l-4 border-blue-500 cursor-pointer hover:shadow-lg transition-shadow"
        >
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-slate-800 pr-2">{order.id}</h4>
            </div>
            <p className="text-sm font-semibold text-slate-600">{order.customerName}</p>
            <p className="text-xs text-slate-500 mt-2 truncate" title={itemSummary}>
                {itemSummary}
            </p>
            {hasRole(WITHDRAW_ROLES) && (
                <button
                    onClick={(e) => { e.stopPropagation(); onWithdrawMaterials(order.id); }}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
                >
                    <IconStock className="h-3.5 w-3.5" />
                    {t('stockMovements.withdraw.title')}
                </button>
            )}
        </div>
    );
};

export default ProductionOrderCard;