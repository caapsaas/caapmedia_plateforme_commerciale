import React, { useState } from 'react';
import { useI18n } from '../i18n';
import { ProductionStatus, Order, OrderStatus } from '../types';
import ProductionOrderCard from '../components/production/ProductionOrderCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, updateProductionStatus } from '../services/apiE-commerce/apiOrders';
import { useAuth } from '../context/AuthContext';

const Production: React.FC = () => {
    const { t } = useI18n();
    const { subsidiary } = useAuth();
    const queryClient = useQueryClient();
    const [draggedOverColumn, setDraggedOverColumn] = useState<ProductionStatus | null>(null);

    const queryKey = ['productionOrders', subsidiary?.id];

    const { data: productionOrders = [], isLoading } = useQuery<Order[]>({
        queryKey: queryKey,
        queryFn: () => getOrders({
            // Le backend devrait être adapté pour exclure certains statuts si nécessaire
            // ou on filtre côté client comme avant.
        }),
        enabled: !!subsidiary,
        // Filtrage côté client pour ne garder que les commandes pertinentes pour la production
        select: (orders) => orders.filter(o =>
            o.status === OrderStatus.IN_PRODUCTION &&
            o.productionStatus &&
            o.productionStatus !== ProductionStatus.READY_FOR_DELIVERY
        ),
    });

    const { mutate: updateStatusMutation } = useMutation({
        mutationFn: updateProductionStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKey });
        },
    });

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, orderId: string) => {
        e.dataTransfer.setData("orderId", orderId);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: ProductionStatus) => {
        e.preventDefault();
        const orderId = e.dataTransfer.getData("orderId");
        const order = productionOrders.find(o => o.id === orderId);
        if (order && order.productionStatus !== newStatus) {
            updateStatusMutation({ orderId, productionStatus: newStatus });
        }
        setDraggedOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, productionStatus: ProductionStatus) => {
        e.preventDefault();
        setDraggedOverColumn(productionStatus);
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

    if (isLoading) {
        return <div className="p-6 text-center">{t('common.loading')}</div>;
    }

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