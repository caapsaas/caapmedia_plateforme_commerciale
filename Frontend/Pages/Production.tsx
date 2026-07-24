import React, { useState } from 'react';
import { useI18n } from '../i18n';
import { OrderStatus, ProductionStatus, Order, UserRole, Subsidiary } from '../types';
import ProductionOrderCard from '../components/production/ProductionOrderCard';
import WithdrawMaterialsModal from '../components/production/WithdrawMaterialsModal';
import ProductionOrderDetailsModal from '../components/production/ProductionOrderDetailsModal';
import ProductionValidationView from '../components/production/ProductionValidationView';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, updateProductionStatus } from '../services/apiE-commerce/apiOrders';
import { getSubsidiaries } from '../services/apiCommon/apiSubsidiaries';
import { useAuth } from '../context/AuthContext';

type Tab = 'validation' | 'kanban';

const Production: React.FC = () => {
    const { t } = useI18n();
    const { subsidiary, user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<Tab>('validation');
    const [draggedOverColumn, setDraggedOverColumn] = useState<ProductionStatus | null>(null);
    const [withdrawOrderId, setWithdrawOrderId] = useState<string | null>(null);
    const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
    const [kanbanSubsidiaryFilter, setKanbanSubsidiaryFilter] = useState<string>('');

    const activeRole = user?.activeRole ?? user?.userRole;
    const isSuperAdmin = activeRole === UserRole.SUPER_ADMIN;
    const isProductionDirector =
        activeRole === UserRole.PRODUCTION_DIRECTOR ||
        activeRole === UserRole.ADMIN ||
        activeRole === UserRole.SUPER_ADMIN;

    const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
        queryKey: ['subsidiaries-list'],
        queryFn: getSubsidiaries,
        enabled: isSuperAdmin,
    });

    const queryKey = ['productionOrders', isSuperAdmin ? kanbanSubsidiaryFilter : subsidiary?.id];

    const { data: productionOrders = [], isLoading } = useQuery<Order[]>({
        queryKey,
        queryFn: () => getOrders(isSuperAdmin ? { subsidiaryId: kanbanSubsidiaryFilter || undefined } : undefined),
        enabled: isSuperAdmin || !!subsidiary,
        select: (orders) => orders.filter(o =>
            (o.status === OrderStatus.IN_PRODUCTION || o.status === OrderStatus.NEW) &&
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
        e.dataTransfer.setData('orderId', orderId);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: ProductionStatus) => {
        e.preventDefault();
        const orderId = e.dataTransfer.getData('orderId');
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-3xl font-bold text-slate-800">{t('production.title')}</h2>

                {/* Onglets — visibles pour le directeur de production */}
                {isProductionDirector && (
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                        <button
                            onClick={() => setActiveTab('validation')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                                activeTab === 'validation'
                                    ? 'bg-[#c6e911] text-slate-800 shadow'
                                    : 'text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Validation
                        </button>
                        <button
                            onClick={() => setActiveTab('kanban')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                                activeTab === 'kanban'
                                    ? 'bg-[#c6e911] text-slate-800 shadow'
                                    : 'text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Kanban production
                        </button>
                    </div>
                )}
            </div>

            {/* Vue Validation */}
            {(activeTab === 'validation' && isProductionDirector) && (
                <ProductionValidationView />
            )}

            {/* Vue Kanban */}
            {(activeTab === 'kanban' || !isProductionDirector) && (
                <>
                    {/* Filtre filiale kanban — Super Admin uniquement */}
                    {isSuperAdmin && subsidiaries.length > 0 && (
                        <div className="flex items-center gap-3">
                            <select
                                value={kanbanSubsidiaryFilter}
                                onChange={e => setKanbanSubsidiaryFilter(e.target.value)}
                                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                            >
                                <option value="">Toutes les filiales</option>
                                {subsidiaries.map(s => (
                                    <option key={s.id} value={s.id}>{s.subsidiaryName}</option>
                                ))}
                            </select>
                            <span className="text-xs text-slate-400">
                                {productionOrders.length} commande{productionOrders.length !== 1 ? 's' : ''} en production
                            </span>
                        </div>
                    )}
                    {isLoading ? (
                        <div className="p-6 text-center text-slate-500">{t('common.loading')}</div>
                    ) : (
                        <div className="flex space-x-4 overflow-x-auto pb-4">
                            {productionColumns.map(status => (
                                <div
                                    key={status}
                                    onDrop={isSuperAdmin ? undefined : (e) => handleDrop(e, status)}
                                    onDragOver={isSuperAdmin ? undefined : (e) => handleDragOver(e, status)}
                                    onDragLeave={isSuperAdmin ? undefined : handleDragLeave}
                                    className={`w-80 bg-slate-100 rounded-lg flex-shrink-0 flex flex-col transition-colors duration-300 ${
                                        !isSuperAdmin && draggedOverColumn === status ? 'bg-slate-200' : ''
                                    }`}
                                >
                                    <div className="p-3 border-b border-slate-300">
                                        <h3 className="font-semibold text-slate-800">{t(`production.status_${status}`)}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {productionOrders.filter(o => o.productionStatus === status).length} commande{productionOrders.filter(o => o.productionStatus === status).length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="mt-4 space-y-3 h-full overflow-y-auto p-2">
                                        {productionOrders
                                            .filter(order => order.productionStatus === status)
                                            .map(order => (
                                                <ProductionOrderCard
                                                    key={order.id}
                                                    order={order}
                                                    onDragStart={(e) => handleDragStart(e, order.id)}
                                                    onWithdrawMaterials={setWithdrawOrderId}
                                                    onViewDetails={setDetailsOrder}
                                                    readOnly={isSuperAdmin}
                                                />
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {withdrawOrderId && (
                <WithdrawMaterialsModal
                    isOpen={!!withdrawOrderId}
                    onClose={() => setWithdrawOrderId(null)}
                    orderId={withdrawOrderId}
                />
            )}

            <ProductionOrderDetailsModal
                isOpen={!!detailsOrder}
                onClose={() => setDetailsOrder(null)}
                order={detailsOrder}
            />
        </div>
    );
};

export default Production;
