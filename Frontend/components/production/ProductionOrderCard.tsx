import React from 'react';
import { Order } from '../../types';

interface ProductionOrderCardProps {
    order: Order;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}

const ProductionOrderCard: React.FC<ProductionOrderCardProps> = ({ order, onDragStart }) => {
    
    const itemSummary = order.orderItems.map(item => `${item.quantity}x ${item.product.productName}`).join(', ');

    return (
        <div
            draggable
            onDragStart={onDragStart}
            className="bg-white rounded-md shadow p-4 border-l-4 border-blue-500 cursor-pointer hover:shadow-lg transition-shadow"
        >
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-slate-800 pr-2">{order.id}</h4>
            </div>
            <p className="text-sm font-semibold text-slate-600">{order.customerName}</p>
            <p className="text-xs text-slate-500 mt-2 truncate" title={itemSummary}>
                {itemSummary}
            </p>
        </div>
    );
};

export default ProductionOrderCard;