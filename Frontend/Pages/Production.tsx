import React, { useState } from 'react';
import { useI18n } from '../i18n';
import { useAppContext } from '../context/AppContext';
import { ProductionStatus, Order, OrderStatus } from '../types';
import ProductionOrderCard from '../components/production/ProductionOrderCard';

const Production: React.FC = () => {
    const { t } = useI18n();
    const { state, dispatch } = useAppContext();
    const { orders, contacts, currentSubsidiary } = state;
    const [draggedOverColumn, setDraggedOverColumn] = useState<ProductionStatus | null>(null);

    if (!currentSubsidiary) return null;

    const productionOrders = orders.filter(o => o.subsidiaryId === currentSubsidiary.id && o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.COMPLETED);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, orderId: string) => {
        e.dataTransfer.setData("orderId", orderId);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: ProductionStatus) => {
        e.preventDefault();
        const orderId = e.dataTransfer.getData("orderId");
        const order = orders.find(o => o.id === orderId);
        if (order && order.productionStatus !== newStatus) {
            dispatch({ type: 'UPDATE_ORDER_PRODUCTION_STATUS', payload: { orderId, newStatus } });
        }
        setDraggedOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: ProductionStatus) => {
        e.preventDefault();
        setDraggedOverColumn(status);
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDraggedOverColumn(null);
    };

    const productionColumns: ProductionStatus[] = [
        ProductionStatus.PREPRESS,
        ProductionStatus.PRINTING,
        ProductionStatus.FINISHING,
        ProductionStatus.READY_FOR_DELIVERY,
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">{t('production.title')}</h2>
            <div className="flex space-x-4 overflow-x-auto pb-4">
                {productionColumns.map(status => (
                    <div
                        key={status}
                        onDrop={(e) => handleDrop(e, status)}
                        onDragOver={(e) => handleDragOver(e, status)}
                        onDragLeave={handleDragLeave}
                        className={`w-80 bg-slate-100 rounded-lg flex-shrink-0 flex flex-col transition-colors duration-300 ${draggedOverColumn === status ? 'bg-slate-200' : ''}`}
                    >
                        <div className="p-3 border-b border-slate-300">
                            <h3 className="font-semibold text-slate-800">{t(`production.status_${status}`)}</h3>
                        </div>
                        <div className="mt-4 space-y-3 h-full overflow-y-auto p-2">
                            {productionOrders
                                .filter(order => order.productionStatus === status)
                                .map(order => (
                                    <ProductionOrderCard
                                        key={order.id}
                                        order={order}
                                        onDragStart={(e) => handleDragStart(e, order.id)}
                                    />
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Production;